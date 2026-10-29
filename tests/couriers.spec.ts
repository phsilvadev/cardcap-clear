import { employeeCouriers } from "../lib/employees/couriers";
import type { Employee } from "../lib/employees/types";
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
test("sincroniza equipe com IDs dos funcionários e descarta cadastro local antigo", () => {
  const store = createDemoOrderStore("loja");
  store.syncCourierTeam([{ ...draft, phone: "11999990000", id: "employee-a" }]);
  expect(store.getSnapshot().couriers[0].id).toBe("employee-a");
  store.syncCourierTeam([{ ...draft, phone: "11999990000", id: "employee-b" }]);
  expect(store.getSnapshot().couriers.map((item) => item.id)).toEqual([
    "employee-b",
  ]);
});
test("atribui e restaura entregador junto ao pedido", () => {
  const storage = memory();
  const store = createDemoOrderStore("loja", () => storage);
  store.hydrate();
  store.syncCourierTeam([{ ...draft, phone: "11999990000", id: "employee-a" }]);
  const courier = store.getSnapshot().couriers[0];
  expect(store.assignCourier("1047", courier.id)).toBe(true);
  const reload = createDemoOrderStore("loja", () => storage);
  reload.hydrate();
  expect(reload.assignCourier("1047", courier.id)).toBe(false);
  reload.syncCourierTeam([{ ...draft, phone: "11999990000", id: courier.id }]);
  expect(reload.getSnapshot().couriers[0].name).toBe(draft.name);
  expect(
    reload.getSnapshot().orders.find((order) => order.id === "1047"),
  ).toMatchObject({ courierId: courier.id, courierName: draft.name });
});
test("bloqueia entregador indisponível e saída quando a disponibilidade muda", () => {
  const store = createDemoOrderStore("loja");
  store.syncCourierTeam([{ ...draft, phone: "11999990000", id: "employee-a" }]);
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
  store.syncCourierTeam([{ ...draft, phone: "11999990000", id: "employee-a" }]);
  const id = store.getSnapshot().couriers[0].id;
  store.assignCourier("1047", id);
  store.advance("1047");
  store.advance("1048");
  expect(store.assignCourier("1048", id)).toBe(false);
  expect(
    store.getSnapshot().orders.find((order) => order.id === "1048")?.courierId,
  ).toBeUndefined();
});
test("permite desatribuir pedido após remover funcionário da equipe", () => {
  const store = createDemoOrderStore("loja");
  store.syncCourierTeam([{ ...draft, phone: "11999990000", id: "employee-a" }]);
  store.assignCourier("1047", "employee-a");
  store.syncCourierTeam([]);
  expect(store.assignCourier("1047", "")).toBe(true);
  expect(
    store.getSnapshot().orders.find((order) => order.id === "1047")?.courierId,
  ).toBeUndefined();
});
test("mantém o nome no histórico após concluir e excluir o entregador", () => {
  const store = createDemoOrderStore("loja");
  store.syncCourierTeam([{ ...draft, phone: "11999990000", id: "employee-a" }]);
  const id = store.getSnapshot().couriers[0].id;
  store.assignCourier("1047", id);
  store.advance("1047");
  store.advance("1047");
  store.syncCourierTeam([]);
  expect(
    store.getSnapshot().orders.find((order) => order.id === "1047"),
  ).toMatchObject({ status: "done", courierName: draft.name });
});
test("não compartilha entregadores entre tenants", () => {
  const storage = memory();
  const first = createDemoOrderStore("loja-a", () => storage);
  first.syncCourierTeam([{ ...draft, phone: "11999990000", id: "employee-a" }]);
  const other = createDemoOrderStore("loja-b", () => storage);
  other.hydrate();
  expect(other.getSnapshot().couriers).toHaveLength(0);
  expect(other.assignCourier("1047", first.getSnapshot().couriers[0].id)).toBe(
    false,
  );
});
test("funcionário desativado deixa de ser elegível para entrega", () => {
  const store = createDemoOrderStore("loja");
  store.syncCourierTeam([{ ...draft, phone: "11999990000", id: "employee-a" }]);
  expect(store.assignCourier("1047", "employee-a")).toBe(true);
  store.syncCourierTeam([]);
  expect(store.assignCourier("1047", "employee-a")).toBe(false);
  store.advance("1047");
  expect(
    store.getSnapshot().orders.find((order) => order.id === "1047")?.status,
  ).toBe("preparing");
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

test("somente funcionários entregadores ativos viram equipe; preserva disponibilidade", () => {
  const employee: Employee = {
    id: "staff",
    name: "Ana Silva",
    email: "ana@example.com",
    role: "courier",
    phone: "11999990000",
    vehicle: "bicycle",
    active: true,
    invited: false,
  };
  const old = [
    { id: "staff", ...draft, available: false },
    { id: "legacy", ...draft },
  ];
  expect(
    employeeCouriers(
      [
        employee,
        { ...employee, id: "inactive", active: false },
        { ...employee, id: "manager", role: "manager" },
      ],
      old,
    ),
  ).toEqual([
    {
      id: "staff",
      name: "Ana Silva",
      phone: "11999990000",
      vehicle: "bicycle",
      available: false,
    },
  ]);
});
