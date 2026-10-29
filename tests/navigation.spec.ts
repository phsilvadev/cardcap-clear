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

test("dashboard exige sessão em todos os domínios", async ({ request }) => {
  for (const host of [
    "localhost:3100",
    "cardap.hero-burger:3100",
    "pizza-da-vila.localhost:3100",
  ]) {
    const response = await request.get("/dashboard", {
      headers: { host },
      maxRedirects: 0,
    });
    expect(response.status()).toBe(307);
    expect(response.headers().location).toContain("/restaurantes/login");
  }
});

test("recusa domínios inválidos e acesso público à rota interna", async ({
  request,
}) => {
  for (const host of [
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

test("Para restaurantes abre o login e mantém o formulário acessível", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("link", { name: "Para restaurantes", exact: true })
    .click();
  await expect(page).toHaveURL("/restaurantes/login");
  await expect(page).toHaveTitle("Entrar no restaurante — Cardap");
  await page.getByLabel("E-mail", { exact: true }).fill("teste@example.com");
  await page.getByLabel("Senha", { exact: true }).fill("senha-de-exemplo");
  await page
    .getByRole("button", { name: "Mostrar senha", exact: true })
    .click();
  await expect(page.locator("#restaurant-password")).toHaveAttribute(
    "type",
    "text",
  );
  await page
    .getByRole("button", { name: "Ocultar senha", exact: true })
    .click();
  await expect(page.locator("#restaurant-password")).toHaveAttribute(
    "type",
    "password",
  );
  await page.route("https://identitytoolkit.googleapis.com/**", (route) =>
    route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({
        error: { code: 400, message: "INVALID_LOGIN_CREDENTIALS" },
      }),
    }),
  );
  await page
    .getByRole("button", { name: "Entrar no restaurante", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "E-mail ou senha incorretos",
  );
  await page.getByRole("link", { name: "Voltar ao início" }).click();
  await page
    .getByRole("link", { name: "Conhecer a área de parceiros" })
    .click();
  await expect(page).toHaveURL("/restaurantes/login");
});

test("login do restaurante se adapta ao celular", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/restaurantes/login");
  await expect(
    page.getByRole("heading", { name: "Bom ter você por aqui." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await expect(
    page.getByRole("button", { name: "Entrar no restaurante", exact: true }),
  ).toBeVisible();
});
