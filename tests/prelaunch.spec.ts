import { test, expect } from "@playwright/test";
import { NextRequest } from "next/server";
import { proxy } from "../proxy";
let original: string | undefined;
test.beforeEach(() => {
  original = process.env.CARDAP_PRELAUNCH_ONLY;
  delete process.env.CARDAP_PRELAUNCH_ONLY;
});
test.afterEach(() => {
  if (original === undefined) delete process.env.CARDAP_PRELAUNCH_ONLY;
  else process.env.CARDAP_PRELAUNCH_ONLY = original;
});
for (const path of [
  "/",
  "/restaurantes",
  "/restaurantes/cadastro",
  "/restaurantes/login",
  "/dashboard",
  "/dashboard/salao",
  "/tenants/exemplo/dashboard",
  "/loja?store=teste",
  "/produto",
  "/checkout",
  "/rota-inexistente",
  "/arquivo.json",
]) {
  test(`pré-lançamento redireciona ${path} sem carregar a página`, async () => {
    const response = await proxy(new NextRequest(`http://localhost${path}`));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/em-breve");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
}
test("libera somente a página e suas imagens no proxy", async () => {
  for (const path of [
    "/em-breve",
    "/branding/cardap-logo.png",
    "/images/launch-restaurant.png",
    "/images/launch-dashboard.png",
    "/images/launch-cardap-devices.png",
    "/images/launch-cardap-transparent.png",
  ]) {
    const response = await proxy(new NextRequest(`http://localhost${path}`));
    expect(response.headers.get("x-middleware-next")).toBe("1");
  }
});
test("APIs e métodos de escrita retornam indisponível, sem executar ações", async () => {
  for (const [path, method] of [
    ["/api/auth/session", "GET"],
    ["/api/auth/session", "POST"],
    ["/api/auth/session", "DELETE"],
    ["/em-breve", "POST"],
    ["/restaurantes/cadastro", "POST"],
  ]) {
    const response = await proxy(
      new NextRequest(`http://localhost${path}`, { method }),
    );
    expect(response.status).toBe(503);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("retry-after")).toBe("3600");
  }
});
test("desativar o modo libera páginas públicas e mantém a autorização no painel", async () => {
  process.env.CARDAP_PRELAUNCH_ONLY = "false";
  expect(
    (await proxy(new NextRequest("http://localhost/restaurantes"))).headers.get(
      "x-middleware-next",
    ),
  ).toBe("1");
  const dashboard = await proxy(
    new NextRequest("http://localhost/dashboard", {
      headers: { host: "localhost" },
    }),
  );
  expect(dashboard.headers.get("location")).toBe(
    "http://localhost/restaurantes/login",
  );
});
