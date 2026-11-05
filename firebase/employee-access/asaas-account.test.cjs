const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createAsaasAccountHandler, validCpf } = require("./asaas-account.cjs");
class HttpsError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}
function fixture(options = {}) {
  let time = 1000000;
  const records = new Map([
    [
      "tenants/owner",
      {
        ownerUid: "owner",
        status: "pending",
        hasCnpj: true,
        cnpj: "11222333000181",
        ownerName: "Maria Silva",
        legalName: "Restaurante Teste",
        ...options.tenant,
      },
    ],
  ]);
  const calls = [];
  const db = {
    doc: (path) => path,
    runTransaction: async (fn) =>
      fn({
        get: async (ref) => ({ data: () => records.get(ref) }),
        set: (ref, data) => records.set(ref, structuredClone(data)),
        update: (ref, data) =>
          records.set(ref, { ...records.get(ref), ...data }),
      }),
  };
  const handler = createAsaasAccountHandler({
    db,
    HttpsError,
    timestamp: () => time,
    now: () => time,
    environment: options.environment || "sandbox",
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      if (options.network) throw new Error("secret-key must not leak");
      return {
        ok: !options.httpStatus,
        status: options.httpStatus || 200,
        json: async () =>
          url.endsWith("/wallets/")
            ? options.wallets || { data: [{ id: "wallet-account-123" }] }
            : {
                cpfCnpj: "11222333000181",
                personType: "JURIDICA",
                companyName: "Restaurante Teste",
                status: "APPROVED",
                ...options.info,
              },
      };
    },
  });
  const call = (action, values = {}, uid = "owner") =>
    handler({
      auth: uid ? { uid } : undefined,
      data: { storeId: "owner", action, ...values },
    });
  const validate = () =>
    call("validate", {
      walletId: "wallet-account-123",
      apiKey: "secret-key",
      cpf: "52998224725",
    });
  return {
    call,
    validate,
    calls,
    records,
    advance: (delta) => {
      time += delta;
    },
  };
}
test("confere a própria carteira, titular e documento antes de salvar; chave nunca é persistida", async () => {
  const f = fixture(),
    result = await f.validate();
  assert.equal(f.records.get("tenants/owner").asaasWalletId, undefined);
  assert.equal(result.holder.name, "Restaurante Teste");
  assert.equal(result.holder.document, "CNPJ •••••0181");
  assert(!JSON.stringify([...f.records]).includes("secret-key"));
  assert(!JSON.stringify([...f.records]).includes('"cpfCnpj"'));
  assert(
    f.calls.every(
      (c) => c.init.method === "GET" && c.init.redirect === "error",
    ),
  );
  await f.call("confirm", { proofId: result.proofId, confirmed: true });
  assert.equal(
    f.records.get("tenants/owner").asaasWalletId,
    "wallet-account-123",
  );
  assert.equal((await f.call("status")).verified, true);
  await f.call("confirm", { proofId: result.proofId, confirmed: true });
});
test("não consulta dados comerciais se a carteira não pertence à chave", async () => {
  const f = fixture({ wallets: { data: [{ id: "other-wallet-id" }] } });
  await assert.rejects(f.validate(), { code: "failed-precondition" });
  assert.equal(f.calls.length, 1);
});
test("não expõe titular de conta com documento divergente ou tipo incompatível", async () => {
  for (const info of [
    { cpfCnpj: "11111111111111" },
    { personType: "FISICA" },
    { status: "DENIED" },
    { status: "PENDING" },
  ]) {
    const f = fixture({ info });
    await assert.rejects(f.validate(), { code: "failed-precondition" });
    assert.equal(f.records.get("tenantAsaasVerification/owner").proof, null);
  }
});
test("CPF é conferido quando a loja declarou não ter CNPJ", async () => {
  const f = fixture({
    tenant: { hasCnpj: false, cnpj: "" },
    info: {
      cpfCnpj: "529.982.247-25",
      personType: "FISICA",
      name: "Maria Silva",
    },
  });
  assert(validCpf("52998224725"));
  assert(!validCpf("11111111111"));
  const result = await f.validate();
  assert.equal(result.holder.name, "Maria Silva");
  assert.equal(result.holder.document, "CPF •••••4725");
  assert(!JSON.stringify([...f.records]).includes("52998224725"));
});
test("exige proprietário e confirmação explícita; não aceita prova de outra loja", async () => {
  const f = fixture();
  await assert.rejects(f.call("validate", {}, null), {
    code: "unauthenticated",
  });
  await assert.rejects(f.call("validate", {}, "other"), {
    code: "permission-denied",
  });
  const proof = await f.validate();
  await assert.rejects(f.call("confirm", { proofId: proof.proofId }), {
    code: "invalid-argument",
  });
  await assert.rejects(
    f.call("confirm", { proofId: "forged", confirmed: true }),
    { code: "failed-precondition" },
  );
});
test("prova expira e alterações cadastrais invalidam confirmação e status", async () => {
  for (const change of [
    (f) => f.advance(600001),
    (f) => {
      f.records.get("tenants/owner").cnpj = "other";
    },
    (f) => {
      f.records.get("tenants/owner").asaasWalletId = "other-wallet";
    },
  ]) {
    const f = fixture(),
      proof = await f.validate();
    change(f);
    await assert.rejects(
      f.call("confirm", { proofId: proof.proofId, confirmed: true }),
      { code: "failed-precondition" },
    );
  }
  const f = fixture(),
    proof = await f.validate();
  await f.call("confirm", { proofId: proof.proofId, confirmed: true });
  f.records.get("tenants/owner").hasCnpj = false;
  assert.equal((await f.call("status")).verified, false);
});
test("loja ativa não pode trocar carteira, mas pode conferir a carteira atual", async () => {
  const f = fixture({
    tenant: { status: "active", asaasWalletId: "different-wallet-id" },
  });
  await assert.rejects(f.validate(), { code: "failed-precondition" });
  assert.equal(f.calls.length, 0);
  const same = fixture({
    tenant: { status: "active", asaasWalletId: "wallet-account-123" },
  });
  const proof = await same.validate();
  await same.call("confirm", { proofId: proof.proofId, confirmed: true });
  assert.equal(same.records.get("tenants/owner").status, "active");
});
test("limita consultas e não refaz chamadas ao Asaas na confirmação", async () => {
  const f = fixture();
  for (let i = 0; i < 5; i++) await f.validate();
  await assert.rejects(f.validate(), { code: "resource-exhausted" });
  assert.equal(f.calls.length, 10);
  f.advance(900001);
  await f.validate();
});
test("falhas do provedor não expõem chave nem resposta bruta", async () => {
  for (const options of [
    { network: true },
    { httpStatus: 401 },
    { httpStatus: 500 },
    { wallets: {} },
  ]) {
    const f = fixture(options);
    await assert.rejects(
      f.validate(),
      (error) =>
        !error.message.includes("secret-key") &&
        ["unavailable", "failed-precondition"].includes(error.code),
    );
  }
});
test("produção consulta apenas domínio fixo; cliente não escolhe ambiente", async () => {
  const f = fixture({ environment: "production" });
  await f.validate();
  assert(f.calls.every((c) => c.url.startsWith("https://api.asaas.com/v3/")));
});

test("confirmação conclui cadastro completo sem ativar vendas", async () => {
  const f = fixture({
    tenant: {
      name: "Minha Loja",
      description: "Comida caseira preparada com carinho.",
      category: "restaurante",
      phone: "11999990000",
      contactEmail: "contato@example.com",
      whatsapp: "",
      postalCode: "01001000",
      street: "Praça da Sé",
      number: "10",
      complement: "",
      district: "Sé",
      city: "São Paulo",
      state: "SP",
      openingDay: "Segunda-feira",
      closingDay: "Sexta-feira",
      openingTime: "18:00",
      closingTime: "23:00",
      acceptsDelivery: false,
      acceptsPickup: true,
    },
  });
  const proof = await f.validate();
  await f.call("confirm", { proofId: proof.proofId, confirmed: true });
  const tenant = f.records.get("tenants/owner");
  assert.equal(tenant.status, "configured");
  assert.equal(tenant.setupCompleted, true);
  assert.equal(tenant.ownerUid, "owner");
});
test("uma nova consulta invalida prova anterior; ambiente da validação é obrigatório", async () => {
  const f = fixture(),
    first = await f.validate(),
    second = await f.validate();
  await assert.rejects(
    f.call("confirm", { proofId: first.proofId, confirmed: true }),
    { code: "failed-precondition" },
  );
  const state = f.records.get("tenantAsaasVerification/owner");
  state.proof.environment = "production";
  await assert.rejects(
    f.call("confirm", { proofId: second.proofId, confirmed: true }),
    { code: "failed-precondition" },
  );
});
