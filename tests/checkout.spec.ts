import { test, expect, type Page } from "@playwright/test";
// The browser calls the real checkout handler through an intercepted Firebase transport.
const { fixture, pixFixture } = require("./support/checkout-fixture.cjs");
async function setup(page: Page, timeoutOnce = false) {
  const f = fixture(),
    p = pixFixture(f),
    requests: Record<string, unknown>[] = [];
  const headers = {
    "access-control-allow-origin": "*",
    "access-control-allow-headers":
      "content-type,authorization,x-firebase-gmpid,x-firebase-appcheck",
    "access-control-allow-methods": "POST,OPTIONS",
  };
  const store = {
    slug: "loja-teste",
    name: "Loja Teste",
    description: "Comida de verdade",
    category: "lanchonete",
    logoUrl: null,
    receivingOrders: true,
    city: "São Paulo",
    state: "SP",
    street: "Rua Teste",
    number: "10",
    district: "Centro",
    openingDay: "Segunda",
    closingDay: "Domingo",
    openingTime: "10:00",
    closingTime: "23:00",
    acceptsDelivery: true,
    acceptsPickup: true,
    deliveryTime: "30 minutos",
    deliveryFeeCents: 590,
  };
  await page.route("**/publicStorefront", async (route) => {
    if (route.request().method() === "OPTIONS")
      return route.fulfill({ status: 204, headers });
    const input = route.request().postDataJSON().data;
    const product = {
      ...f.data.get("tenants/store/products/burger"),
      id: "burger",
      imageUrl: null,
    };
    const result =
      input.action === "product"
        ? { store, product, preview: false }
        : input.action === "summary"
          ? { store, preview: false }
          : {
              store,
              products: [product],
              categories: [{ id: "food", name: "Lanches" }],
              nextProductCursor: null,
              preview: false,
            };
    await route.fulfill({ headers, json: { result } });
  });
  await page.route("**/publicCheckout", async (route) => {
    if (route.request().method() === "OPTIONS")
      return route.fulfill({ status: 204, headers });
    const input = route.request().postDataJSON().data;
    try {
      const result = await f.checkout.handler({
        data: input,
        rawRequest: { ip: "127.0.0.1" },
      });
      if (input.action === "create") {
        requests.push(input);
        if (timeoutOnce) {
          timeoutOnce = false;
          return route.fulfill({
            headers,
            status: 503,
            json: {
              error: {
                status: "UNAVAILABLE",
                message: "Resposta perdida após gravação",
              },
            },
          });
        }
      }
      await route.fulfill({ headers, json: { result } });
    } catch (reason) {
      const error = reason as { code: string; message: string };
      await route.fulfill({
        headers,
        status: 400,
        json: {
          error: {
            status: error.code.toUpperCase().replaceAll("-", "_"),
            message: error.message,
          },
        },
      });
    }
  });
  await page.route("**/publicCheckoutPix", async (route) => {
    if (route.request().method() === "OPTIONS")
      return route.fulfill({ status: 204, headers });
    const input = route.request().postDataJSON().data;
    const result = await p.service.handler({ data: input });
    await route.fulfill({ headers, json: { result } });
  });
  return { f, p, requests };
}
async function checkout(page: Page) {
  await page.goto("/produto?store=loja-teste&product=burger");
  await expect(
    page.getByRole("heading", { name: "Burger", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Adicionar ao carrinho", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Produto adicionado");
  await page.getByRole("link", { name: "Ver carrinho", exact: true }).click();
  await expect(page).toHaveURL(/\/carrinho\?store=loja-teste/);
  await page.getByRole("link", { name: "Continuar para entrega" }).click();
  await expect(page).toHaveURL(/\/checkout\?store=loja-teste/);
  await page.getByLabel("Nome", { exact: true }).fill("Cliente Integração");
  await page.getByLabel("Telefone com DDD").fill("11999990000");
  await page.getByLabel("Endereço completo").fill("Rua Integração, 10");
  await page.getByRole("button", { name: "Continuar para pagamento" }).click();
  await expect(page.locator(".commerce-summary")).toContainText("R$ 30,90");
}
test("compra real com resposta perdida repete o mesmo envio e cria um único pedido a pagar", async ({
  page,
}) => {
  test.setTimeout(60000);
  const { f, requests } = await setup(page, true);
  await checkout(page);
  await page
    .getByRole("button", { name: "Confirmar pedido", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Conferir o mesmo envio" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Conferir o mesmo envio" }).click();
  await expect(
    page.getByRole("heading", { name: "Pedido enviado à loja" }),
  ).toBeVisible();
  await expect(
    page.getByText("Pagamento pendente:", { exact: false }),
  ).toBeVisible();
  expect(requests).toHaveLength(2);
  expect(requests[0]).toEqual(requests[1]);
  const orders = [...f.data.entries()].filter(([key]: [string, unknown]) =>
    key.includes("/orders/"),
  );
  expect(orders).toHaveLength(1);
  expect(orders[0][1].total).toBe(3090);
  expect(orders[0][1].paymentStatus).toBe("due_on_fulfillment");
});
test("Pix não envia à cozinha antes de confirmação do backend e permite retomar após recarregar", async ({
  page,
}) => {
  test.setTimeout(60000);
  const { f, p } = await setup(page);
  await checkout(page);
  await page.getByRole("radio", { name: "Pix online", exact: true }).check();
  await page.getByLabel("CPF do pagador").fill("52998224725");
  await page
    .getByRole("button", { name: "Confirmar pedido", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Aguardando pagamento Pix" }),
  ).toBeVisible();
  expect(
    [...f.data.keys()].some((key: string) => key.includes("/orders/")),
  ).toBe(false);
  await page.getByRole("button", { name: "Gerar ou consultar Pix" }).click();
  await expect(page.getByLabel("Código Pix copia e cola")).toHaveValue(
    "pix-code",
  );
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Aguardando pagamento Pix" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Gerar ou consultar Pix" }).click();
  await expect(page.getByLabel("Código Pix copia e cola")).toHaveValue(
    "pix-code",
  );
  expect(p.created).toBe(1);
  p.setPayment({ status: "RECEIVED" });
  await p.service.applyPayment("pay_test");
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(
    page.getByRole("heading", { name: "Pedido enviado à loja" }),
  ).toBeVisible();
  await expect(
    page.getByText("Pagamento recebido e confirmado pelo sistema."),
  ).toBeVisible();
});
