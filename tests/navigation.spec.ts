import { test, expect } from "@playwright/test";

const routes = [
  "/",
  "/restaurantes",
  "/loja",
  "/produto",
  "/carrinho",
  "/checkout",
  "/pagamento",
  "/pedido-confirmado",
  "/cliente",
];

for (const route of routes) {
  test(`renderiza ${route} sem erros de execução ou hidratação`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (
        message.type() === "error" &&
        /hydrat|react|uncaught/i.test(message.text())
      )
        errors.push(message.text());
    });
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
    expect(errors).toEqual([]);
  });
}

test("redireciona todos os endereços HTML e preserva a região", async ({
  request,
}) => {
  for (const route of routes) {
    const oldPath =
      route === "/" ? "/cardap.html" : `/cardap-${route.slice(1)}.html`;
    const response = await request.get(`${oldPath}?city=Campinas&state=SP`, {
      maxRedirects: 0,
    });
    expect(response?.status()).toBe(308);
    expect(response.headers().location).toBe(`${route}?city=Campinas&state=SP`);
  }
});

test("busca restaurantes pela região informada", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#state option")).toHaveCount(28);
  await page.locator("#city").fill("Campinas");
  await page.locator("#state").selectOption("SP");
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(page).toHaveURL(/\/restaurantes\?city=Campinas&state=SP/);
  await expect(page.locator("main")).toContainText("Campinas");
});

test("permite entrar e sair da conta demonstrativa", async ({ page }) => {
  await page.goto("/cliente");
  await page.locator("#demo-login").click();
  await expect(page.locator("#account")).toBeVisible();
  await page.locator("#profile-name").fill("Maria Silva");
  await page.locator("#profile-form button[type=submit]").click();
  await expect(page.locator("#account-name")).toHaveText("Maria Silva");
  await page.reload();
  await expect(page.locator("#account-name")).toHaveText("Maria Silva");
  await page.locator("#sign-out").click();
  await expect(page.locator("#guest")).toBeVisible();
});

test("conclui o fluxo de compra demonstrativo", async ({ page }) => {
  await page.goto("/carrinho");
  await page.locator("#load-example").click();
  await expect(page.locator("#cart-lines .cart-line")).toHaveCount(2);
  await page.locator("#checkout-link").click();
  await expect(page).toHaveURL(/\/checkout\?/);
  await page.locator("#customer-name").fill("Maria Silva");
  await page.locator("#customer-phone").fill("11999999999");
  await page.locator("#customer-address").fill("Rua das Flores, 123");
  await page.locator("#checkout-form button[type=submit]").click();
  await expect(page).toHaveURL(/\/pagamento\?/);
  await page.locator("#payment-form button[type=submit]").click();
  await expect(page).toHaveURL(/\/pedido-confirmado\?/);
  await expect(page.locator("#confirmation-details")).toContainText(
    "Maria Silva",
  );
  await expect(page.locator("#confirmation-details")).toContainText("DEMO-");
});

test("alterna as seções e o recebimento de pedidos do painel", async ({
  page,
}) => {
  await page.goto("http://cardap.hero-burger:3100/dashboard");
  await page.locator('[data-view="orders"]').click();
  await expect(page.locator("#view-orders")).toBeVisible();
  await page.locator('[data-view="menu"]').click();
  await expect(page.locator("#products-list")).not.toBeEmpty();
  await page.locator("#store-toggle").click();
  await expect(page.locator("#store-toggle")).toHaveAttribute(
    "aria-checked",
    "false",
  );
});

test("resolve dinamicamente o tenant pelo domínio e preserva a URL pública", async ({
  page,
}) => {
  for (const [slug, name] of [
    ["hero-burger", "Hero Burger"],
    ["pizza-da-vila", "Pizza Da Vila"],
  ]) {
    const url = `http://cardap.${slug}:3100/dashboard?origem=teste`;
    const response = await page.goto(url);
    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(url);
    await expect(page).toHaveTitle(`${name} — Dashboard — Cardap`);
    await expect(page.locator(".store-name")).toHaveText(name);
    await expect(page.locator("#setting-name")).toHaveValue(name);
  }
});

test("mantém o estado de cada tenant separado", async ({ page }) => {
  await page.goto("http://cardap.hero-burger:3100/dashboard");
  await page.locator("#store-toggle").click();
  await expect(page.locator("#store-toggle")).toHaveAttribute(
    "aria-checked",
    "false",
  );
  await page.goto("http://cardap.pizza-da-vila:3100/dashboard");
  await expect(page.locator("#store-toggle")).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await page.goto("http://cardap.hero-burger:3100/dashboard");
  await expect(page.locator("#store-toggle")).toHaveAttribute(
    "aria-checked",
    "false",
  );
});

test("recusa domínios inválidos e acesso público à rota interna", async ({
  request,
}) => {
  for (const host of [
    "localhost:3100",
    "cardap.-invalido",
    "cardap.hero-burger.evil.com",
    "hero-burger.localhost.evil.com",
    "localhost.hero-burger",
    "-invalido.localhost",
  ]) {
    const response = await request.get("/dashboard", { headers: { host } });
    expect(response.status()).toBe(404);
  }
  const response = await request.get("/tenants/pizza-da-vila/dashboard", {
    headers: { host: "cardap.hero-burger" },
  });
  expect(response.status()).toBe(404);
});

test("bloqueia a rota interna mesmo quando o tenant coincide com o domínio", async ({
  request,
}) => {
  const response = await request.get("/tenants/hero-burger/dashboard", {
    headers: { host: "cardap.hero-burger" },
  });
  expect(response.status()).toBe(404);
});

test("acessa tenants em localhost sem DNS ou hosts personalizados", async ({
  page,
}) => {
  for (const [slug, name] of [
    ["hero-burger", "Hero Burger"],
    ["pizza-da-vila", "Pizza Da Vila"],
  ]) {
    const url = `http://${slug}.localhost:3100/dashboard`;
    const response = await page.goto(url);
    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(url);
    await expect(page.locator(".store-name")).toHaveText(name);
    await expect(page.locator("#setting-name")).toHaveValue(name);
  }
});
