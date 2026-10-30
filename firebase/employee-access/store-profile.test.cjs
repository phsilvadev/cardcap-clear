const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createStoreProfileHandler } = require("./store-profile.cjs");
const {
  normalizeSection,
  profileComplete,
  validCnpj,
} = require("./store-profile-schema.cjs");
class HttpsError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}
const complete = {
  ownerUid: "owner",
  status: "configured",
  name: "Minha Loja",
  description: "Comida caseira preparada com carinho.",
  category: "restaurante",
  ownerName: "Maria Silva",
  phone: "11999990000",
  contactEmail: "contato@example.com",
  hasCnpj: false,
  cnpj: "",
  legalName: "",
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
};
function fixture(initial = complete) {
  let data = { ...initial };
  const updates = [];
  const handler = createStoreProfileHandler({
    HttpsError,
    timestamp: () => 123,
    db: {
      doc: (path) => {
        assert.equal(path, "tenants/owner");
        return { path };
      },
      runTransaction: async (action) =>
        action({
          get: async () => ({ data: () => data }),
          update: (_ref, fields) => {
            updates.push(fields);
            data = { ...data, ...fields };
          },
        }),
    },
  });
  const save = (section, values, uid = "owner") =>
    handler({ auth: { uid }, data: { storeId: "owner", section, values } });
  return { handler, save, updates, get: () => data };
}
test("valida CNPJ numérico e alfanumérico sem apagar letras", () => {
  assert(validCnpj("11.222.333/0001-81"));
  assert(validCnpj("00.000.000/E08G-12"));
  assert(!validCnpj("11.222.333/0001-82"));
  assert(!validCnpj("00.000.000/0000-00"));
  assert(!validCnpj("11!222333000181"));
});
test("telefone, CEP e taxa são normalizados nos campos que o checklist usa", () => {
  const company = normalizeSection("company", {
    ownerName: " Maria Silva ",
    phone: "(11) 99999-0000",
    contactEmail: "CONTATO@EXAMPLE.COM",
    hasCnpj: false,
  });
  assert.deepEqual(company.issues, []);
  assert.equal(company.values.phone, "11999990000");
  assert.equal(company.values.contactEmail, "contato@example.com");
  const delivery = normalizeSection("delivery", {
    acceptsDelivery: true,
    acceptsPickup: false,
    deliveryTime: "30–45 min",
    deliveryFee: "12,50",
  });
  assert.equal(delivery.values.deliveryFeeCents, 1250);
  assert.deepEqual(delivery.issues, []);
  assert(
    normalizeSection("company", {
      ownerName: "Maria Silva",
      phone: "11999990000",
      contactEmail: "a@example.com",
      hasCnpj: true,
      cnpj: "invalid",
      legalName: "Empresa",
    }).issues.includes("CNPJ válido"),
  );
  assert(
    normalizeSection("details", {
      name: "Loja",
      description: "Descrição com tamanho suficiente.",
      category: "restaurante",
      status: "active",
    }).issues.length,
  );
});
test("escolher sem CNPJ permite completar cadastro e guarda declaração sem inventar prazo", async () => {
  const f = fixture();
  await f.save("company", {
    ownerName: "Maria Silva",
    phone: "11999990000",
    contactEmail: "contato@example.com",
    hasCnpj: false,
  });
  assert.equal(f.get().cnpjDeclaredAt, 123);
  assert.equal(f.get().cnpj, "");
  assert.equal(f.get().setupCompleted, true);
  assert(!("cnpjRequiredAt" in f.get()));
  assert.equal(f.get().status, "configured");
});
test("apenas o dono altera a própria loja e status não pode vir no formulário", async () => {
  const f = fixture();
  await assert.rejects(
    f.save("wallet", { asaasWalletId: "test-wallet-id" }, "other"),
    { code: "permission-denied" },
  );
  await assert.rejects(f.handler({ data: { storeId: "owner" } }), {
    code: "unauthenticated",
  });
  await assert.rejects(
    f.save("wallet", { asaasWalletId: "test-wallet-id", status: "active" }),
    { code: "invalid-argument" },
  );
  assert.equal(f.updates.length, 0);
});
test("cadastro inicial completo passa para configurado, sem ativar a loja", async () => {
  const f = fixture({ ...complete, status: "pending", asaasWalletId: "" });
  assert(!profileComplete(f.get()));
  await f.save("wallet", { asaasWalletId: "test-wallet-id" });
  assert.equal(f.get().status, "configured");
  assert.equal(f.get().setupCompleted, true);
  assert.equal(f.get().ownerUid, "owner");
});
test("cadastro incompleto continua pendente e não é marcado como finalizado", async () => {
  const f = fixture({
    ownerUid: "owner",
    status: "pending",
    ownerName: "Maria Silva",
  });
  await f.save("details", {
    name: "Minha Loja",
    description: "Comida caseira preparada com carinho.",
    category: "restaurante",
  });
  assert.equal(f.get().status, "pending");
  assert.equal(f.get().setupCompleted, false);
});
test("não altera carteira de recebimento de loja ativa nem muda estado de ativação", async () => {
  const f = fixture({ ...complete, status: "active" });
  await assert.rejects(f.save("wallet", { asaasWalletId: "outra-wallet-id" }), {
    code: "failed-precondition",
  });
  await f.save("hours", {
    openingDay: "Segunda-feira",
    closingDay: "Sábado",
    openingTime: "09:00",
    closingTime: "22:00",
  });
  assert.equal(f.get().asaasWalletId, "test-wallet-id");
  assert.equal(f.get().status, "active");
});

test("seções fora da lista permitida são recusadas", () => {
  for (const section of ["__proto__", "constructor", "toString", "invalid"])
    assert(normalizeSection(section, {}).issues.length);
});
