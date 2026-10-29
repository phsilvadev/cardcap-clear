import { test, expect } from "@playwright/test";
import { evaluateStoreReadiness } from "../lib/onboarding/readiness";
const complete = {
  name: "Minha Loja",
  description: "Comida caseira preparada com carinho.",
  category: "restaurante",
  ownerName: "Maria Silva",
  phone: "11999990000",
  contactEmail: "contato@example.com",
  postalCode: "01001000",
  street: "Praça da Sé",
  number: "10",
  district: "Sé",
  city: "São Paulo",
  state: "SP",
  openingDay: "Segunda-feira",
  closingDay: "Sexta-feira",
  openingTime: "18:00",
  closingTime: "23:00",
  acceptsDelivery: true,
  acceptsPickup: true,
  deliveryTime: "30–45 min",
  deliveryFeeCents: 0,
  asaasWalletId: "test-wallet-id",
  setupCompleted: true,
  status: "active",
};
test("marca as dez etapas completas apenas com dados válidos e ativação", () => {
  expect(
    evaluateStoreReadiness(complete, true, true).every((item) => item.complete),
  ).toBe(true);
  expect(evaluateStoreReadiness(complete, true, true)).toHaveLength(10);
});
test("cadastro inicial exibe as pendências sem inventar conclusão", () => {
  const items = evaluateStoreReadiness(
    { name: "Minha Loja", ownerName: "Maria Silva", status: "pending" },
    false,
    false,
  );
  expect(items.every((item) => !item.complete)).toBe(true);
  expect(items.find((item) => item.id === "company")?.missing).toContain(
    "telefone com DDD",
  );
  expect(items.find((item) => item.id === "address")?.missing).toContain("CEP");
});
test("cadastro completo não equivale a publicação", () => {
  const items = evaluateStoreReadiness(
    { ...complete, status: "configured" },
    true,
    true,
  );
  expect(items.filter((item) => item.complete)).toHaveLength(9);
  expect(items.find((item) => item.id === "activation")?.complete).toBe(false);
});
test("retirada não exige prazo e taxa de entrega", () => {
  const items = evaluateStoreReadiness(
    {
      ...complete,
      acceptsDelivery: false,
      deliveryTime: undefined,
      deliveryFeeCents: undefined,
    },
    true,
    true,
  );
  expect(items.find((item) => item.id === "delivery")?.complete).toBe(true);
});
test("horários iguais e entrega sem taxa ficam pendentes", () => {
  const items = evaluateStoreReadiness(
    { ...complete, closingTime: "18:00", deliveryFeeCents: null },
    true,
    true,
  );
  expect(items.find((item) => item.id === "hours")?.complete).toBe(false);
  expect(items.find((item) => item.id === "delivery")?.complete).toBe(false);
});
test("carteira, categorias e produtos são conferidos separadamente", () => {
  const items = evaluateStoreReadiness(
    { ...complete, asaasWalletId: "" },
    true,
    false,
  );
  expect(items.find((item) => item.id === "wallet")?.complete).toBe(false);
  expect(items.find((item) => item.id === "categories")?.complete).toBe(true);
  expect(items.find((item) => item.id === "products")?.complete).toBe(false);
});
