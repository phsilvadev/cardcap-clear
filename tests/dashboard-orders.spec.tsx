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
test("quadro de pedidos mantém cards legíveis em desktop e celular", async ({
  page,
}) => {
  const markup = renderToStaticMarkup(
    <DashboardOrders tenantSlug="visual-test" />,
  );
  const css =
    fs.readFileSync("app/globals.css", "utf8") +
    fs.readFileSync("app/(tenant)/_styles/dashboard.css", "utf8");
  for (const width of [1600, 375]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.setContent(
      `<style>${css}</style><main style="padding:24px">${markup}</main>`,
    );
    await page.locator("#view-orders").evaluate((element) => {
      element.removeAttribute("hidden");
    });
    await expect(page.locator(".incoming-orders-column")).toHaveCount(4);
    await expect(page.locator(".incoming-order-card")).toHaveCount(5);
    await expect(
      page.getByRole("button", { name: "Aceitar pedido #1048" }),
    ).toBeVisible();
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
  await page.getByRole("button", { name: /Em preparo.*Na cozinha/ }).click();
  await expect(page.locator("#view-orders")).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(
          sessionStorage.getItem("cardap-demo-dashboard:sync-test")!,
        ).orders.find((order: { id: string }) => order.id === "1048").status,
    ),
  ).toBe("done");
});
