const test = require("node:test");
const assert = require("node:assert/strict");
const { createCourierHandler } = require("./create-courier.cjs");
class HttpsError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}
const input = {
  auth: { uid: "owner" },
  data: {
    storeId: "owner",
    name: "Ana Silva",
    email: " ANA@EXAMPLE.COM ",
    phone: "(11) 99999-0000",
    vehicle: "bicycle",
  },
};
function fixture({
  duplicate = false,
  ownerUid = "owner",
  status = "active",
} = {}) {
  const writes = [];
  const employees = {
    doc: () => ({ id: "staff" }),
    where: () => ({ limit: () => "query" }),
  };
  const tenant = { collection: () => employees };
  const db = {
    doc: () => tenant,
    runTransaction: async (fn) =>
      fn({
        get: async (ref) =>
          ref === tenant
            ? { data: () => ({ ownerUid, status }) }
            : { empty: !duplicate },
        create: (ref, data) => writes.push(data),
      }),
  };
  return {
    writes,
    run: createCourierHandler({ db, HttpsError, timestamp: () => "timestamp" }),
  };
}
test("cria um único funcionário entregador sem conceder acesso ao sistema", async () => {
  const { run, writes } = fixture();
  assert.deepEqual(await run(input), { employeeId: "staff" });
  assert.deepEqual(writes, [
    {
      storeId: "owner",
      name: "Ana Silva",
      email: "ana@example.com",
      phone: "11999990000",
      vehicle: "bicycle",
      role: "courier",
      active: true,
      invited: false,
      createdAt: "timestamp",
    },
  ]);
});
test("rejeita duplicação do mesmo email na equipe", async () => {
  const { run, writes } = fixture({ duplicate: true });
  await assert.rejects(run(input), { code: "already-exists" });
  assert.equal(writes.length, 0);
});
test("nega outra loja e sessão ausente", async () => {
  const { run, writes } = fixture();
  await assert.rejects(run({ ...input, auth: undefined }), {
    code: "unauthenticated",
  });
  await assert.rejects(run({ ...input, auth: { uid: "other" } }), {
    code: "permission-denied",
  });
  assert.equal(writes.length, 0);
});
for (const store of [
  { ownerUid: "other" },
  { status: "suspended" },
  { status: "pending" },
])
  test(`recusa loja sem autorização: ${JSON.stringify(store)}`, async () => {
    const { run, writes } = fixture(store);
    await assert.rejects(run(input), { code: "permission-denied" });
    assert.equal(writes.length, 0);
  });
test("valida telefone e veículo no servidor", async () => {
  const { run, writes } = fixture();
  for (const data of [
    { ...input.data, phone: "123" },
    { ...input.data, vehicle: "invalid" },
  ])
    await assert.rejects(run({ ...input, data }), { code: "invalid-argument" });
  assert.equal(writes.length, 0);
});
