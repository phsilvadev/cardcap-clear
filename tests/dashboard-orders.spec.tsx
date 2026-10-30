import React from "react";
import fs from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import DashboardContent from "../app/(tenant)/_components/dashboard";
import { renderToStaticMarkup } from "react-dom/server";
import { test, expect } from "@playwright/test";
import { createDemoOrderStore } from "../lib/orders/demo-store";
import DashboardOrders from "../app/(tenant)/_components/dashboard/dashboard-orders";

function storage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}
test("avança somente pelas etapas permitidas e restaura ao recarregar", () => {
  const memory = storage();
  const store = createDemoOrderStore("loja-a", () => memory);
  store.hydrate();
  for (const status of ["preparing", "delivery", "done", "done"]) {
    store.advance("1048");
    expect(
      store.getSnapshot().orders.find((order) => order.id === "1048")?.status,
    ).toBe(status);
  }
  const reloaded = createDemoOrderStore("loja-a", () => memory);
  reloaded.hydrate();
  expect(
    reloaded.getSnapshot().orders.find((order) => order.id === "1048")?.status,
  ).toBe("done");
});
test("preserva os dados de configuração ao salvar pedidos", () => {
  const memory = storage();
  memory.setItem(
    "cardap-demo-dashboard:loja-a",
    JSON.stringify({ open: false, settings: { name: "Minha Loja" } }),
  );
  const store = createDemoOrderStore("loja-a", () => memory);
  store.hydrate();
  store.advance("1048");
  expect(
    JSON.parse(memory.getItem("cardap-demo-dashboard:loja-a")!),
  ).toMatchObject({ open: false, settings: { name: "Minha Loja" } });
});
test("mantém pedidos isolados entre tenants", () => {
  const memory = storage();
  const first = createDemoOrderStore("loja-a", () => memory);
  const other = createDemoOrderStore("loja-b", () => memory);
  first.hydrate();
  other.hydrate();
  first.advance("1048");
  expect(
    other.getSnapshot().orders.find((order) => order.id === "1048")?.status,
  ).toBe("new");
});
test("falha de armazenamento mantém a etapa anterior", () => {
  const store = createDemoOrderStore("loja-a", () => ({
    getItem: () => null,
    setItem: () => {
      throw new Error("blocked");
    },
  }));
  store.hydrate();
  store.advance("1048");
  expect(
    store.getSnapshot().orders.find((order) => order.id === "1048")?.status,
  ).toBe("new");
  expect(store.getSnapshot().message).toContain("anteriores");
});
test("filtrar não altera os pedidos e limpa a busca anterior", () => {
  const store = createDemoOrderStore("loja-a");
  store.setSearch("Mariana");
  store.setFilter("preparing");
  expect(store.getSnapshot().filter).toBe("preparing");
  expect(store.getSnapshot().search).toBe("");
  expect(store.getSnapshot().orders).toHaveLength(5);
});
test("central de pedidos mantém lista e detalhes legíveis em desktop e celular", async ({
  page,
}) => {
  const markup = renderToStaticMarkup(
    <DashboardOrders tenantSlug="visual-test" />,
  );
  const css =
    fs.readFileSync("app/globals.css", "utf8") +
    fs.readFileSync("app/(tenant)/_styles/dashboard.css", "utf8") +
    fs.readFileSync("app/(tenant)/_styles/products.css", "utf8");
  for (const width of [1600, 375]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.setContent(
      `<style>${css}</style><main style="padding:24px">${markup}</main>`,
    );
    await page.locator("#view-orders").evaluate((element) => {
      element.removeAttribute("hidden");
    });
    await expect(
      page.getByRole("complementary", { name: "Lista de pedidos" }),
    ).toBeVisible();
    await expect(page.locator(".orders-inbox-item")).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Selecione um pedido" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Aceitar pedido #1048" }),
    ).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `/tmp/cardap-orders-${width}.png`,
      fullPage: true,
    });
  }
});

test("ações da visão geral mantêm etapas, contadores e filtro sincronizados", async ({
  page,
}) => {
  const markup = renderToStaticMarkup(
    <DashboardContent tenant={{ slug: "sync-test", name: "Loja de teste" }} />,
  );
  await page.goto("/");
  await page.setContent(
    `<span class="store-name"></span><span id="breadcrumb"></span><button id="store-toggle"><span id="store-status"></span></button>${markup}`,
  );
  await page.evaluate(() =>
    sessionStorage.setItem(
      "cardap-demo-dashboard:sync-test",
      JSON.stringify({
        couriers: [
          {
            id: "courier-test",
            name: "Entregador de teste",
            phone: "11999990000",
            vehicle: "motorcycle",
            available: true,
          },
        ],
      }),
    ),
  );
  const source = [
    "lib/orders/demo-store.ts",
    "lib/dom.ts",
    "app/(tenant)/_lib/dashboard.ts",
  ]
    .map((file) =>
      stripTypeScriptTypes(fs.readFileSync(file, "utf8"))
        .replace(/^import .*;$/gm, "")
        .replace(/export default /g, "")
        .replace(/export /g, ""),
    )
    .join("\n");
  await page.addScriptTag({
    content: `${source}\ninitialize({slug: "sync-test", name: "Loja de teste"});`,
  });
  await expect(page.locator("#stat-active")).toHaveText("3");
  await page
    .locator("#recent-orders")
    .getByRole("button", { name: "Aceitar pedido #1048" })
    .click();
  await page
    .locator("#recent-orders")
    .getByRole("button", { name: "Saiu para entrega #1048" })
    .click();
  await page
    .locator("#recent-orders")
    .getByRole("button", { name: "Concluir pedido #1048" })
    .click();
  await expect(page.locator("#stat-active")).toHaveText("2");
  await page.locator("#store-toggle").click();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(sessionStorage.getItem("cardap-demo-dashboard:sync-test")!)
          .couriers.length,
    ),
  ).toBe(1);
  await expect(
    page.locator("#recent-orders .order-card").first(),
  ).toContainText("Concluído");
  expect(
    await page.evaluate(
      () =>
        JSON.parse(
          sessionStorage.getItem("cardap-demo-dashboard:sync-test")!,
        ).orders.find((order: { id: string }) => order.id === "1048").status,
    ),
  ).toBe("done");
  await page.route("**/dashboard/pedidos?status=preparing", (route) =>
    route.fulfill({
      status: 200,
      contentType: "text/html",
      body: "<h1>Pedidos</h1>",
    }),
  );
  await page.getByRole("button", { name: /Em preparo.*Na cozinha/ }).click();
  await expect(page).toHaveURL(/\/dashboard\/pedidos\?status=preparing$/);
});

test("cancelamento exige motivo, preserva o pedido e impede novo avanço", () => {
  const memory = storage();
  const store = createDemoOrderStore("cancel-test", () => memory);
  store.hydrate();
  expect(store.cancel("1048", " ")).toBe(false);
  expect(store.cancel("1045", "Cliente desistiu")).toBe(false);
  expect(store.cancel("1048", "Item indisponível")).toBe(true);
  store.advance("1048");
  expect(
    store.getSnapshot().orders.find((order) => order.id === "1048"),
  ).toMatchObject({
    status: "cancelled",
    cancellationReason: "Item indisponível",
  });
  expect(store.getSnapshot().orders).toHaveLength(5);
  const reloaded = createDemoOrderStore("cancel-test", () => memory);
  reloaded.hydrate();
  expect(
    reloaded.getSnapshot().orders.find((order) => order.id === "1048"),
  ).toMatchObject({
    status: "cancelled",
    cancellationReason: "Item indisponível",
  });
});

test("aceite cria uma única comanda e restaura fila e preferência", () => {
  const memory = storage();
  const store = createDemoOrderStore("print-test", () => memory);
  store.hydrate();
  store.setAutoAccept(true);
  store.advance("1048");
  store.advance("1048");
  expect(store.getSnapshot().printJobs).toEqual([
    { id: "print-test:1048:accepted", orderId: "1048", state: "pending" },
  ]);
  const reloaded = createDemoOrderStore("print-test", () => memory);
  reloaded.hydrate();
  expect(reloaded.getSnapshot().autoAccept).toBe(true);
  expect(reloaded.getSnapshot().printJobs).toHaveLength(1);
  reloaded.setPrintState("print-test:1048:accepted", "submitted");
  expect(reloaded.getSnapshot().printJobs[0].state).toBe("submitted");
});
test("falha ao salvar aceite não avança pedido nem cria comanda", () => {
  const store = createDemoOrderStore("print-failed", () => ({
    getItem: () => null,
    setItem: () => {
      throw new Error("blocked");
    },
  }));
  store.hydrate();
  store.advance("1048");
  expect(store.getSnapshot().orders[0].status).toBe("new");
  expect(store.getSnapshot().printJobs).toHaveLength(0);
});
