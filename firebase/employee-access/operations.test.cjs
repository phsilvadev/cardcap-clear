const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createOperationsHandler } = require("./operations.cjs");
class HttpsError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}
function fixture(
  tenant = { ownerUid: "owner", status: "configured", name: "Loja" },
) {
  const writes = [];
  const handler = createOperationsHandler({
    HttpsError,
    timestamp: () => "timestamp",
    db: {
      doc: (path) => path,
      runTransaction: async (action) =>
        action({
          get: async () => ({ data: () => tenant }),
          update: (ref, fields) => writes.push({ ref, fields }),
        }),
    },
  });
  return { handler, writes };
}
const request = {
  auth: { uid: "owner" },
  data: { storeId: "owner", salon: true, ownDelivery: false },
};
test("recusa requisição sem sessão", async () => {
  const { handler, writes } = fixture();
  await assert.rejects(handler({ data: request.data }), {
    code: "unauthenticated",
  });
  assert.equal(writes.length, 0);
});
test("recusa alteração de outra loja", async () => {
  const { handler, writes } = fixture();
  await assert.rejects(
    handler({ ...request, data: { ...request.data, storeId: "other" } }),
    { code: "permission-denied" },
  );
  assert.equal(writes.length, 0);
});
test("recusa vínculo inválido ou cadastro pendente", async () => {
  for (const tenant of [
    undefined,
    { ownerUid: "other", status: "active" },
    { ownerUid: "owner", status: "pending" },
  ]) {
    const { handler, writes } = fixture(tenant === undefined ? null : tenant);
    await assert.rejects(handler(request), { code: "permission-denied" });
    assert.equal(writes.length, 0);
  }
});
test("recusa opções inválidas e caminhos de documentos", async () => {
  for (const data of [
    { ...request.data, salon: "true" },
    { ...request.data, ownDelivery: null },
    { ...request.data, storeId: "owner/other" },
  ]) {
    const { handler, writes } = fixture();
    await assert.rejects(handler({ ...request, data }), {
      code: "invalid-argument",
    });
    assert.equal(writes.length, 0);
  }
});
test("salva apenas operação e data sem alterar dados da loja", async () => {
  const { handler, writes } = fixture();
  assert.deepEqual(
    await handler({
      ...request,
      data: { ...request.data, ownerUid: "attacker", status: "active" },
    }),
    { operations: { salon: true, ownDelivery: false } },
  );
  assert.deepEqual(writes, [
    {
      ref: "tenants/owner",
      fields: {
        operations: { salon: true, ownDelivery: false },
        updatedAt: "timestamp",
      },
    },
  ]);
});
