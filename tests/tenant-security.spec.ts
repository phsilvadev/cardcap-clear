import { test, expect } from "@playwright/test";
import { NextRequest } from "next/server";
import { POST, DELETE } from "../app/api/auth/session/route";
import { verifyTenantSession } from "../lib/auth/session";

test.describe("validação da sessão no servidor", () => {
  let originalFetch: typeof fetch;
  let originalKey: string | undefined;
  let originalProject: string | undefined;
  test.beforeEach(() => {
    originalFetch = globalThis.fetch;
    originalKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    originalProject = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = "test-key";
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "test-project";
  });
  test.afterEach(() => {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined)
      delete process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    else process.env.NEXT_PUBLIC_FIREBASE_API_KEY = originalKey;
    if (originalProject === undefined)
      delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    else process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = originalProject;
  });
  const token = (claims = {}) =>
    `header.${Buffer.from(JSON.stringify({ aud: "test-project", iss: "https://securetoken.google.com/test-project", sub: "owner", exp: Date.now() / 1000 + 3600, auth_time: Date.now() / 1000, ...claims })).toString("base64url")}.signature`;
  function mock(
    options: {
      status?: string;
      owner?: string;
      domainOwner?: string;
      disabled?: boolean;
      rejectIdentity?: boolean;
      validSince?: string;
      operations?: Record<string, unknown>;
    } = {},
  ) {
    let calls = 0;
    globalThis.fetch = (async () => {
      calls++;
      if (calls === 1)
        return Response.json(
          {
            users: [
              {
                localId: "owner",
                disabled: options.disabled,
                validSince: options.validSince,
              },
            ],
          },
          { status: options.rejectIdentity ? 400 : 200 },
        );
      if (calls === 2)
        return Response.json({
          fields: {
            operations: { mapValue: { fields: options.operations ?? {} } },
            ownerUid: { stringValue: options.owner ?? "owner" },
            slug: { stringValue: "minha-loja" },
            name: { stringValue: "Minha Loja" },
            status: { stringValue: options.status ?? "pending" },
          },
        });
      return Response.json({
        fields: { tenantId: { stringValue: options.domainOwner ?? "owner" } },
      });
    }) as typeof fetch;
  }
  test("libera proprietário com domínio reservado, inclusive no cadastro inicial", async () => {
    mock();
    expect(await verifyTenantSession(token())).toEqual({
      uid: "owner",
      slug: "minha-loja",
      name: "Minha Loja",
      status: "pending",
      operations: { salon: false, ownDelivery: false },
    });
  });
  test("carrega apenas opções booleanas habilitadas na loja", async () => {
    mock({
      operations: {
        salon: { booleanValue: true },
        ownDelivery: { stringValue: "true" },
      },
    });
    expect((await verifyTenantSession(token()))?.operations).toEqual({
      salon: true,
      ownDelivery: false,
    });
  });
  for (const [name, options] of [
    ["token rejeitado pelo Firebase", { rejectIdentity: true }],
    ["conta desabilitada", { disabled: true }],
    ["loja suspensa", { status: "suspended" }],
    ["outro proprietário", { owner: "other" }],
    ["domínio de outro tenant", { domainOwner: "other" }],
    ["sessão revogada", { validSince: String(Date.now() / 1000 + 1000) }],
  ] as const)
    test(`bloqueia ${name}`, async () => {
      mock(options);
      expect(await verifyTenantSession(token())).toBeNull();
    });
  for (const [name, claims] of [
    ["token expirado", { exp: 1 }],
    ["outro projeto", { aud: "other-project" }],
    ["outro emissor", { iss: "https://example.com" }],
  ] as const)
    test(`bloqueia ${name}`, async () => {
      mock();
      expect(await verifyTenantSession(token(claims))).toBeNull();
    });
  test("estabelece cookie protegido e permite logout", async () => {
    mock();
    const response = await POST(
      new NextRequest("http://localhost/api/auth/session", {
        method: "POST",
        headers: {
          host: "localhost",
          origin: "http://localhost",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken: token() }),
      }),
    );
    expect(response.status).toBe(200);
    const cookie = response.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("HttpOnly");
    expect(cookie.toLowerCase()).toContain("samesite=strict");
    expect(cookie).not.toContain("Domain=");
    const logout = await DELETE(
      new NextRequest("http://localhost/api/auth/session", {
        method: "DELETE",
        headers: { host: "localhost", origin: "http://localhost" },
      }),
    );
    expect(logout.status).toBe(204);
    expect(logout.headers.get("set-cookie")).toContain("Max-Age=0");
  });
  test("login com subdomínio habilitado preserva porta e cookie restrito ao host", async () => {
    const previous = process.env.AUTH_TENANT_SUBDOMAIN_LOGIN;
    try {
      process.env.AUTH_TENANT_SUBDOMAIN_LOGIN = "true";
      mock();
      const response = await POST(
        new NextRequest("http://localhost:3001/api/auth/session", {
          method: "POST",
          headers: {
            host: "localhost:3001",
            origin: "http://localhost:3001",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ idToken: token() }),
        }),
      );
      expect((await response.json()).destination).toBe(
        "http://minha-loja.localhost:3001/dashboard",
      );
      expect(response.headers.get("set-cookie")).not.toContain("Domain=");
    } finally {
      if (previous === undefined)
        delete process.env.AUTH_TENANT_SUBDOMAIN_LOGIN;
      else process.env.AUTH_TENANT_SUBDOMAIN_LOGIN = previous;
    }
  });
  test("não cria sessão no domínio de outro restaurante", async () => {
    mock();
    const response = await POST(
      new NextRequest("http://outra-loja.localhost/api/auth/session", {
        method: "POST",
        headers: {
          host: "outra-loja.localhost",
          origin: "http://outra-loja.localhost",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken: token() }),
      }),
    );
    expect(response.status).toBe(403);
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });
  test("falha de rede mantém o painel bloqueado", async () => {
    globalThis.fetch = async () => {
      throw new Error("offline");
    };
    expect(await verifyTenantSession(token())).toBeNull();
  });
});

test("API de sessão rejeita CSRF, JSON inválido e token ausente", async ({
  request,
}) => {
  const url = "http://127.0.0.1:3100/api/auth/session";
  expect(
    (
      await request.post(url, {
        headers: { origin: "https://evil.example" },
        data: {},
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.delete(url, { headers: { origin: "https://evil.example" } })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.post(url, {
        headers: { origin: "http://127.0.0.1:3100" },
        data: {},
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post(url, {
        headers: {
          origin: "http://127.0.0.1:3100",
          "Content-Type": "application/json",
        },
        data: "{",
      })
    ).status(),
  ).toBe(400);
});

test("cookie inventado não libera o dashboard", async ({ request }) => {
  const response = await request.get("/dashboard", {
    headers: { Cookie: "cardap_session=invalid-token" },
    maxRedirects: 0,
  });
  expect(response.status()).toBe(307);
  expect(response.headers().location).toContain("/restaurantes/login");
});

for (const route of [
  "/dashboard/cardapio",
  "/dashboard/cardapio/novo",
  "/dashboard/cardapio/produto-teste/editar",
]) {
  test(`protege a rota do cardápio ${route}`, async ({ request }) => {
    const response = await request.get(route, { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    expect(response.headers().location).toContain("/restaurantes/login");
  });
}
