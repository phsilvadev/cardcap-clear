import { test, expect } from "@playwright/test";
import { NextRequest } from "next/server";
import {
  tenantDashboardUrl,
  allowedTransferSource,
} from "../lib/auth/tenant-url";
import {
  POST as transfer,
  GET as readTransfer,
} from "../app/api/auth/transfer/route";
import {
  POST as logoutTransfer,
  GET as finishLogout,
} from "../app/api/auth/logout-transfer/route";
import { DELETE as logout } from "../app/api/auth/session/route";

test("subdomínio usa o slug e preserva porta e protocolo", () => {
  expect(tenantDashboardUrl("http://localhost:3001", "hero-burger")).toBe(
    "http://hero-burger.localhost:3001/dashboard",
  );
  expect(
    tenantDashboardUrl(
      "http://127.0.0.1:3002",
      "hero-burger",
      "/dashboard/pedidos",
    ),
  ).toBe("http://hero-burger.localhost:3002/dashboard/pedidos");
  expect(() =>
    tenantDashboardUrl("http://outra-loja.localhost:3001", "hero-burger"),
  ).toThrow();
  expect(
    allowedTransferSource(
      "https://evil.example",
      "http://hero-burger.localhost:3001",
    ),
  ).toBe(false);
  expect(
    allowedTransferSource(
      "http://localhost:3002",
      "http://hero-burger.localhost:3001",
    ),
  ).toBe(false);
});
test("transferência recusa origem externa antes de consumir código", async () => {
  const response = await transfer(
    new NextRequest("http://hero-burger.localhost:3001/api/auth/transfer", {
      method: "POST",
      headers: {
        host: "hero-burger.localhost:3001",
        origin: "https://evil.example",
      },
      body: "code=abc",
    }),
  );
  expect(response.status).toBe(403);
});
test("transferência entrega token somente por cookie HttpOnly e nunca por URL", async () => {
  const original = globalThis.fetch;
  const project = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  try {
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "demo-cardap";
    globalThis.fetch = (async () =>
      Response.json({
        result: { customToken: "custom-secret", slug: "hero-burger" },
      })) as typeof fetch;
    const body = new URLSearchParams({
      code: "a".repeat(64),
      path: "/dashboard",
    });
    const response = await transfer(
      new NextRequest("http://hero-burger.localhost:3001/api/auth/transfer", {
        method: "POST",
        headers: {
          host: "hero-burger.localhost:3001",
          origin: "http://localhost:3001",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      }),
    );
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "http://hero-burger.localhost:3001/restaurantes/continuar",
    );
    expect(response.headers.get("location")).not.toContain("secret");
    const cookie = response.cookies.get("cardap_login_transfer");
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.domain).toBeUndefined();
    const result = await readTransfer(
      new NextRequest("http://hero-burger.localhost:3001/api/auth/transfer", {
        headers: {
          host: "hero-burger.localhost:3001",
          "X-Cardap-Transfer": "1",
          cookie: `cardap_login_transfer=${encodeURIComponent(cookie!.value)}`,
        },
      }),
    );
    expect(result.status).toBe(200);
    expect((await result.json()).customToken).toBe("custom-secret");
    expect(result.cookies.get("cardap_login_transfer")?.maxAge).toBe(0);
  } finally {
    globalThis.fetch = original;
    if (project === undefined)
      delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    else process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = project;
  }
});
test("cookie de transferência não pode ser lido sem cabeçalho de origem da aplicação", async () => {
  const result = await readTransfer(
    new NextRequest("http://hero-burger.localhost:3001/api/auth/transfer", {
      headers: { host: "hero-burger.localhost:3001" },
    }),
  );
  expect(result.status).toBe(403);
});
test("logout limpa a sessão do tenant e encaminha limpeza da origem central", async () => {
  const result = await logout(
    new NextRequest("http://hero-burger.localhost:3001/api/auth/session", {
      method: "DELETE",
      headers: {
        host: "hero-burger.localhost:3001",
        origin: "http://hero-burger.localhost:3001",
        cookie: `cardap_login_origin=${encodeURIComponent("http://localhost:3001")}`,
      },
    }),
  );
  expect(result.status).toBe(200);
  expect((await result.json()).logoutOrigin).toBe("http://localhost:3001");
  expect(result.cookies.get("cardap_session")?.maxAge).toBe(0);
  const central = await logoutTransfer(
    new NextRequest("http://localhost:3001/api/auth/logout-transfer", {
      method: "POST",
      headers: {
        host: "localhost:3001",
        origin: "http://hero-burger.localhost:3001",
      },
    }),
  );
  expect(central.status).toBe(303);
  expect(central.cookies.get("cardap_session")?.maxAge).toBe(0);
  const denied = await finishLogout(
    new NextRequest("http://localhost:3001/api/auth/logout-transfer", {
      headers: { host: "localhost:3001" },
    }),
  );
  expect(denied.status).toBe(403);
});
