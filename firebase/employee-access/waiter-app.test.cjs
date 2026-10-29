const test = require("node:test");
const assert = require("node:assert/strict");
const { createWaiterSessionHandler } = require("./waiter-session.cjs");
const {
  createEnableWaiterAccessHandler,
} = require("./enable-waiter-access.cjs");
class HttpsError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}
const storePath = "tenants/owner",
  staffPath = "tenants/owner/employees/staff",
  mapPath = "waiterAccounts/waiter-user";
function fixture({
  employee = {},
  store = {},
  mapping,
  existingEmail = false,
  disabled = false,
} = {}) {
  const records = new Map([
    [
      storePath,
      {
        name: "Loja",
        phone: "11999990000",
        ownerUid: "owner",
        status: "active",
        ...store,
      },
    ],
    [
      staffPath,
      {
        name: "Ana Silva",
        email: "ana@example.com",
        phone: "11999990000",
        vehicle: "motorcycle",
        storeId: "owner",
        role: "waiter",
        active: true,
        ...employee,
      },
    ],
  ]);
  if (mapping) records.set(mapPath, mapping);
  const calls = [];
  const doc = (path) => ({
    path,
    get: async () => ({
      exists: records.has(path),
      data: () => records.get(path),
    }),
  });
  const db = {
    doc,
    runTransaction: async (fn) =>
      fn({
        get: (ref) => ref.get(),
        update: (ref, data) =>
          records.set(ref.path, { ...records.get(ref.path), ...data }),
        create: (ref, data) => records.set(ref.path, data),
      }),
  };
  const auth = {
    createUser: async (data) => {
      calls.push(["create", data.email]);
      if (existingEmail)
        throw Object.assign(new Error(), { code: "auth/email-already-exists" });
      return { uid: "waiter-user" };
    },
    getUser: async (uid) => ({ uid, email: "ana@example.com", disabled }),
    deleteUser: async (uid) => calls.push(["delete", uid]),
    generatePasswordResetLink: async (email) => {
      calls.push(["link", email]);
      return "https://example.com/action?mode=resetPassword&oobCode=test";
    },
  };
  return {
    records,
    calls,
    session: createWaiterSessionHandler({ db, auth, HttpsError }),
    enable: createEnableWaiterAccessHandler({ db, auth, HttpsError }),
  };
}
const owner = {
  auth: { uid: "owner" },
  data: { storeId: "owner", employeeId: "staff" },
};
const waiter = {
  auth: { uid: "waiter-user" },
  data: { storeId: "another-store" },
};
test("proprietário libera conta nova e vínculo sem enviar email", async () => {
  const f = fixture();
  assert.match((await f.enable(owner)).link, /oobCode=/);
  assert.deepEqual(f.records.get(mapPath), {
    storeId: "owner",
    employeeId: "staff",
  });
  assert.equal(f.records.get(staffPath).uid, "waiter-user");
  assert.equal(f.records.get(staffPath).invited, true);
  assert.deepEqual(f.calls, [
    ["create", "ana@example.com"],
    ["link", "ana@example.com"],
  ]);
});
test("app resolve apenas o vínculo do usuário autenticado, ignorando loja enviada", async () => {
  const f = fixture({
    employee: { uid: "waiter-user" },
    mapping: { storeId: "owner", employeeId: "staff" },
  });
  const session = await f.session(waiter);
  assert.equal(session.storeId, "owner");
  assert.equal(session.employeeId, "staff");
  assert.equal(session.uid, "waiter-user");
});
test("conta existente vinculada pode gerar novo link", async () => {
  const f = fixture({
    employee: { uid: "waiter-user" },
    mapping: { storeId: "owner", employeeId: "staff" },
  });
  await f.enable(owner);
  assert.deepEqual(f.calls, [["link", "ana@example.com"]]);
});
test("não associa nem redefine senha de email já pertencente a outra conta", async () => {
  const f = fixture({ existingEmail: true });
  await assert.rejects(f.enable(owner), { code: "already-exists" });
  assert.equal(f.records.has(mapPath), false);
  assert.equal(
    f.calls.some((call) => call[0] === "link"),
    false,
  );
});
for (const employee of [
  { active: false },
  { role: "manager" },
  { uid: "another-user" },
])
  test(`app rejeita vínculo inválido: ${JSON.stringify(employee)}`, async () => {
    const f = fixture({
      employee: { uid: "waiter-user", ...employee },
      mapping: { storeId: "owner", employeeId: "staff" },
    });
    await assert.rejects(f.session(waiter), { code: "permission-denied" });
  });
test("app rejeita loja suspensa e usuário sem mapeamento", async () => {
  await assert.rejects(
    fixture({
      store: { status: "suspended" },
      employee: { uid: "waiter-user" },
      mapping: { storeId: "owner", employeeId: "staff" },
    }).session(waiter),
    { code: "permission-denied" },
  );
  await assert.rejects(fixture().session(waiter), {
    code: "permission-denied",
  });
});
test("liberação recusa outra loja, garçom inativo e vínculo adulterado", async () => {
  const f = fixture();
  await assert.rejects(f.enable({ ...owner, auth: { uid: "other" } }), {
    code: "permission-denied",
  });
  assert.equal(f.calls.length, 0);
  const inactive = fixture({ employee: { active: false } });
  await assert.rejects(inactive.enable(owner), { code: "failed-precondition" });
  assert.equal(inactive.calls.length, 0);
  const wrong = fixture({
    employee: { uid: "waiter-user" },
    mapping: { storeId: "other", employeeId: "staff" },
  });
  await assert.rejects(wrong.enable(owner), { code: "failed-precondition" });
  assert.equal(wrong.calls.length, 0);
});
test("ambas as funções exigem autenticação", async () => {
  const f = fixture();
  await assert.rejects(f.enable({ data: owner.data }), {
    code: "unauthenticated",
  });
  await assert.rejects(f.session({}), { code: "unauthenticated" });
});

test("app recusa conta desativada no Authentication", async () => {
  const f = fixture({
    disabled: true,
    employee: { uid: "waiter-user" },
    mapping: { storeId: "owner", employeeId: "staff" },
  });
  await assert.rejects(f.session(waiter), { code: "permission-denied" });
});

test("app de garçom recusa funcionário entregador", async () => {
  const f = fixture({
    employee: { uid: "waiter-user", role: "courier" },
    mapping: { storeId: "owner", employeeId: "staff" },
  });
  await assert.rejects(f.session(waiter), { code: "permission-denied" });
});
