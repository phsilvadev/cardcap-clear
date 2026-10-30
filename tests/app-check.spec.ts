import { test, expect } from "@playwright/test";
import { NextRequest } from "next/server";
import { verifyWebAppCheck } from "../lib/security/app-check";
import { POST } from "../app/api/auth/session/route";
test.describe("proteção App Check na sessão", () => {
  const variables = [
    "FIREBASE_APPCHECK_ENFORCE",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "NEXT_PUBLIC_FIREBASE_APP_ID",
  ] as const;
  let previous: Record<string, string | undefined>;
  test.beforeEach(() => {
    previous = Object.fromEntries(
      variables.map((name) => [name, process.env[name]]),
    );
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "test-project";
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID = "test-web-app";
  });
  test.afterEach(() => {
    for (const name of variables) {
      if (previous[name] === undefined) delete process.env[name];
      else process.env[name] = previous[name];
    }
  });
  test("aceita somente prova válida do aplicativo web correto", async () => {
    const valid = {
      app_id: "test-web-app",
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    expect(await verifyWebAppCheck("valid-proof", async () => valid)).toEqual({
      appId: "test-web-app",
      expireTime: valid.exp,
    });
    expect(
      await verifyWebAppCheck("other-app", async () => ({
        ...valid,
        app_id: "other-app",
      })),
    ).toBeNull();
    expect(
      await verifyWebAppCheck("expired-proof", async () => ({
        ...valid,
        exp: 1,
      })),
    ).toBeNull();
    expect(
      await verifyWebAppCheck("invalid-signature", async () => {
        throw new Error("invalid signature");
      }),
    ).toBeNull();
  });
  test("token ausente ou excessivo não chega ao verificador", async () => {
    let calls = 0;
    const verify = async () => {
      calls++;
      throw new Error("must not run");
    };
    expect(await verifyWebAppCheck(null, verify)).toBeNull();
    expect(await verifyWebAppCheck("x".repeat(8193), verify)).toBeNull();
    expect(calls).toBe(0);
  });
  test("configuração incompleta não libera uma prova", async () => {
    delete process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
    expect(
      await verifyWebAppCheck("proof", async () => ({
        app_id: "test-web-app",
        exp: Date.now() / 1000 + 3600,
      })),
    ).toBeNull();
  });
  test("sessão com proteção exigida rejeita POST sem prova antes de consultar credenciais", async () => {
    process.env.FIREBASE_APPCHECK_ENFORCE = "true";
    const response = await POST(
      new NextRequest("http://localhost:3001/api/auth/session", {
        method: "POST",
        headers: {
          origin: "http://localhost:3001",
          host: "localhost:3001",
          "content-type": "application/json",
        },
        body: JSON.stringify({ idToken: "not-an-identity-token" }),
      }),
    );
    expect(response.status).toBe(401);
    expect(response.cookies.get("cardap_session")).toBeUndefined();
  });
  test("SDK oficial rejeita token com assinatura inválida", async () => {
    expect(await verifyWebAppCheck("not-a-jwt")).toBeNull();
  });
});
