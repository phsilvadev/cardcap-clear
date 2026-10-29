const test = require("node:test");
const assert = require("node:assert/strict");
const { createWaiterHandler } = require("./create-waiter.cjs");
class HttpsError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}
const request = {
  auth: { uid: "owner" },
  data: { storeId: "owner", name: "Ana Silva", email: " ANA@EXAMPLE.COM " },
};
function fixture(duplicate = false) {
  const writes = [];
  const employees = {
    doc: () => ({ id: "waiter" }),
    where: () => ({ limit: () => "query" }),
  };
  const tenant = { collection: () => employees };
  const db = {
    doc: () => tenant,
    runTransaction: (fn) =>
      fn({
        get: async (ref) =>
          ref === tenant
            ? { data: () => ({ ownerUid: "owner", status: "active" }) }
            : { empty: !duplicate },
        create: (ref, data) => writes.push(data),
      }),
  };
  return {
    writes,
    run: createWaiterHandler({ db, HttpsError, timestamp: () => "timestamp" }),
  };
}
test("cadastra garçom sem conceder acesso automaticamente", async () => {
  const f = fixture();
  assert.deepEqual(await f.run(request), { employeeId: "waiter" });
  assert.deepEqual(f.writes, [
    {
      storeId: "owner",
      name: "Ana Silva",
      email: "ana@example.com",
      role: "waiter",
      active: true,
      invited: false,
      createdAt: "timestamp",
    },
  ]);
});
test("recusa outra loja e email duplicado", async () => {
  const f = fixture();
  await assert.rejects(f.run({ ...request, auth: { uid: "other" } }), {
    code: "permission-denied",
  });
  assert.equal(f.writes.length, 0);
  await assert.rejects(fixture(true).run(request), { code: "already-exists" });
});
test("recusa cadastro inválido e sessão ausente", async () => {
  await assert.rejects(
    fixture().run({ ...request, data: { ...request.data, email: "invalid" } }),
    { code: "invalid-argument" },
  );
  await assert.rejects(fixture().run({ data: request.data }), {
    code: "unauthenticated",
  });
});
