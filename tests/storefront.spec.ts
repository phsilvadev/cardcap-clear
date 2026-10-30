import { test, expect } from "@playwright/test";
const store = {
  slug: "hero-burger",
  name: "Hero Burger",
  description: "Hambúrgueres feitos na hora.",
  category: "lanchonete",
  logoUrl: null,
  receivingOrders: true,
  city: "São Paulo",
  state: "SP",
  street: "Rua das Flores",
  number: "120",
  district: "Centro",
  openingDay: "Segunda-feira",
  closingDay: "Domingo",
  openingTime: "18:00",
  closingTime: "23:30",
  acceptsDelivery: true,
  acceptsPickup: true,
  deliveryTime: "30–45 min",
  deliveryFeeCents: 590,
};
const products = [
  {
    id: "burger",
    name: "Burger da casa",
    description: "Pão, carne e queijo.",
    priceCents: 2990,
    categoryId: "burgers",
    imageUrl: null,
  },
  {
    id: "suco",
    name: "Suco de laranja",
    description: "Natural, 300 ml.",
    priceCents: 990,
    categoryId: "drinks",
    imageUrl: null,
  },
];
test("cliente consulta restaurantes reais, filtra o cardápio e recebe mudança de status", async ({
  page,
}) => {
  let receiving = true;
  await page.route("**/publicStorefront", async (route) => {
    const headers = {
      "access-control-allow-origin": "*",
      "access-control-allow-headers":
        "content-type,authorization,x-firebase-gmpid",
      "access-control-allow-methods": "POST,OPTIONS",
    };
    if (route.request().method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers });
      return;
    }
    const input = route.request().postDataJSON().data;
    const current = { ...store, receivingOrders: receiving };
    const result =
      input.action === "list"
        ? { stores: [current], nextCursor: null }
        : input.action === "summary"
          ? { store: current, preview: false }
          : {
              store: current,
              products,
              categories: [
                { id: "burgers", name: "Hambúrgueres" },
                { id: "drinks", name: "Bebidas" },
              ],
              nextProductCursor: null,
              preview: false,
            };
    await route.fulfill({
      status: 200,
      headers,
      contentType: "application/json",
      body: JSON.stringify({ result }),
    });
  });
  await page.goto("/restaurantes?city=S%C3%A3o%20Paulo&state=SP");
  await expect(
    page.getByRole("heading", { name: "Hero Burger" }),
  ).toBeVisible();
  await expect(page.getByText("Quintal da Mesa", { exact: true })).toHaveCount(
    0,
  );
  await page
    .getByRole("searchbox", { name: "Buscar restaurante" })
    .fill("outra loja");
  await expect(
    page.getByRole("heading", { name: "Nenhum restaurante encontrado" }),
  ).toBeVisible();
  await page
    .getByRole("searchbox", { name: "Buscar restaurante" })
    .fill("hero");
  receiving = false;
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.locator(".catalog-status")).toHaveText(
    "Recebimento pausado",
  );
  receiving = true;
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.locator(".catalog-status")).toHaveText("Recebendo pedidos");
  await page.locator(".catalog-restaurant").click();
  await expect(page).toHaveURL(/\/loja\?.*store=hero-burger/);
  await expect(
    page.getByRole("heading", { name: "Hero Burger", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Rua das Flores, 120")).toBeVisible();
  await expect(page.getByText("R$ 29,90", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Bebidas", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Burger da casa", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Suco de laranja" }),
  ).toBeVisible();
  receiving = false;
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.locator(".catalog-status")).toHaveText(
    "Recebimento pausado",
  );
  await expect(
    page.getByText("O recebimento de pedidos está pausado.", { exact: false }),
  ).toBeVisible();
  await page.setViewportSize({ width: 375, height: 812 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("loja indisponível não apresenta dados ou cardápio fictícios", async ({
  page,
}) => {
  await page.route("**/publicStorefront", (route) =>
    route.fulfill({
      status: 404,
      headers: { "access-control-allow-origin": "*" },
      contentType: "application/json",
      body: JSON.stringify({
        error: {
          status: "NOT_FOUND",
          message: "Esta loja não está disponível.",
        },
      }),
    }),
  );
  await page.goto("/loja?store=loja-inexistente");
  await expect(
    page.getByRole("heading", { name: "Loja indisponível" }),
  ).toBeVisible();
  await expect(page.locator(".catalog-product")).toHaveCount(0);
});

test("detalhe sem loja selecionada oferece navegação com título acessível", async ({
  page,
}) => {
  await page.goto("/loja");
  await expect(
    page.getByRole("heading", { level: 1, name: "Escolha um restaurante" }),
  ).toBeVisible();
});
