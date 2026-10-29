import { test, expect } from "@playwright/test";
import { createDemoOrderStore } from "../lib/orders/demo-store";
const draft = {
  name: "Ana Entregas",
  phone: "(11) 99999-0000",
  vehicle: "motorcycle" as const,
  available: true,
};
function memory() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}
test("cadastro valida telefone e impede duplicata", () => {
  const store = createDemoOrderStore("loja");
  expect(store.saveCourier(undefined, { ...draft, phone: "123" })).toBe(false);
  expect(store.getSnapshot().couriers).toHaveLength(0);
  expect(store.saveCourier(undefined, draft)).toBe(true);
  expect(store.getSnapshot().couriers[0].phone).toBe("11999990000");
  expect(store.saveCourier(undefined, draft)).toBe(false);
  expect(store.getSnapshot().couriers).toHaveLength(1);
});
test("atribui e restaura entregador junto ao pedido", () => {
  const storage = memory();
  const store = createDemoOrderStore("loja", () => storage);
  store.hydrate();
  store.saveCourier(undefined, draft);
  const courier = store.getSnapshot().couriers[0];
  expect(store.assignCourier("1047", courier.id)).toBe(true);
  const reload = createDemoOrderStore("loja", () => storage);
  reload.hydrate();
  expect(reload.getSnapshot().couriers[0].name).toBe(draft.name);
  expect(
    reload.getSnapshot().orders.find((order) => order.id === "1047"),
  ).toMatchObject({ courierId: courier.id, courierName: draft.name });
});
test("bloqueia entregador indisponível e saída quando a disponibilidade muda", () => {
  const store = createDemoOrderStore("loja");
  store.saveCourier(undefined, draft);
  const id = store.getSnapshot().couriers[0].id;
  store.assignCourier("1047", id);
  store.toggleCourier(id);
  store.advance("1047");
  expect(
    store.getSnapshot().orders.find((order) => order.id === "1047")?.status,
  ).toBe("preparing");
  expect(store.assignCourier("1046", id)).toBe(false);
});
test("impede atribuir o mesmo entregador a outra entrega em andamento", () => {
  const store = createDemoOrderStore("loja");
  store.saveCourier(undefined, draft);
  const id = store.getSnapshot().couriers[0].id;
  store.assignCourier("1047", id);
  store.advance("1047");
  store.advance("1048");
  expect(store.assignCourier("1048", id)).toBe(false);
  expect(
    store.getSnapshot().orders.find((order) => order.id === "1048")?.courierId,
  ).toBeUndefined();
});
test("protege exclusão com pedidos ativos e permite após desatribuir", () => {
  const store = createDemoOrderStore("loja");
  store.saveCourier(undefined, draft);
  const id = store.getSnapshot().couriers[0].id;
  store.assignCourier("1047", id);
  expect(store.removeCourier(id)).toBe(false);
  expect(store.assignCourier("1047", "")).toBe(true);
  expect(store.removeCourier(id)).toBe(true);
  expect(store.getSnapshot().couriers).toHaveLength(0);
});
test("mantém o nome no histórico após concluir e excluir o entregador", () => {
  const store = createDemoOrderStore("loja");
  store.saveCourier(undefined, draft);
  const id = store.getSnapshot().couriers[0].id;
  store.assignCourier("1047", id);
  store.advance("1047");
  store.advance("1047");
  expect(store.removeCourier(id)).toBe(true);
  expect(
    store.getSnapshot().orders.find((order) => order.id === "1047"),
  ).toMatchObject({ status: "done", courierName: draft.name });
});
test("não compartilha entregadores entre tenants", () => {
  const storage = memory();
  const first = createDemoOrderStore("loja-a", () => storage);
  first.saveCourier(undefined, draft);
  const other = createDemoOrderStore("loja-b", () => storage);
  other.hydrate();
  expect(other.getSnapshot().couriers).toHaveLength(0);
  expect(other.assignCourier("1047", first.getSnapshot().couriers[0].id)).toBe(
    false,
  );
});
test("falha ao salvar não adiciona entregador", () => {
  const store = createDemoOrderStore("loja", () => ({
    getItem: () => null,
    setItem: () => {
      throw new Error("blocked");
    },
  }));
  expect(store.saveCourier(undefined, draft)).toBe(false);
  expect(store.getSnapshot().couriers).toHaveLength(0);
});
test("a página de entregadores exige autenticação", async ({ request }) => {
  const response = await request.get("/dashboard/entregadores", {
    maxRedirects: 0,
  });
  expect(response.status()).toBe(307);
  expect(response.headers().location).toContain("/restaurantes/login");
  expect(
    (
      await request.get("/tenants/loja/entregadores", { maxRedirects: 0 })
    ).status(),
  ).toBe(404);
});
