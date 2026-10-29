const test = require("node:test");
const assert = require("node:assert/strict");
const { createAccessLinkHandler } = require("./handler.cjs");
class HttpsError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}
function fixture(employee = {}) {
  const calls = [];
  const handler = createAccessLinkHandler({
    HttpsError,
    db: {
      doc: (path) => ({
        get: async () => ({
          data: () =>
            path === "tenants/owner"
              ? { ownerUid: "owner", status: "active" }
              : {
                  storeId: "owner",
                  role: "attendant",
                  active: true,
                  email: "staff@example.com",
                  uid: "staff",
                  ...employee,
                },
        }),
      }),
    },
    auth: {
      getUser: async (uid) => {
        calls.push(["lookup", uid]);
        return { email: "staff@example.com", disabled: false };
      },
      generatePasswordResetLink: async (email) => {
        calls.push(["generate", email]);
        return "https://example.com/action?mode=resetPassword&oobCode=test";
      },
    },
  });
  return { handler, calls };
}
const request = {
  auth: { uid: "owner" },
  data: { storeId: "owner", employeeId: "employee" },
};
test("retorna link sem enviar email", async () => {
  const { handler, calls } = fixture();
  assert.match((await handler(request)).link, /oobCode=/);
  assert.deepEqual(calls, [
    ["lookup", "staff"],
    ["generate", "staff@example.com"],
  ]);
});
test("nega usuário sem sessão e outra loja antes de gerar link", async () => {
  const { handler, calls } = fixture();
  await assert.rejects(handler({ data: request.data }), {
    code: "unauthenticated",
  });
  await assert.rejects(handler({ ...request, auth: { uid: "other" } }), {
    code: "permission-denied",
  });
  assert.equal(calls.length, 0);
});
for (const [name, employee] of Object.entries({
  inactive: { active: false },
  unbound: { uid: undefined },
  owner: { uid: "owner" },
  anotherStore: { storeId: "other" },
  wrongEmail: { email: "other@example.com" },
})) {
  test(`não gera link para vínculo inválido: ${name}`, async () => {
    const { handler, calls } = fixture(employee);
    await assert.rejects(handler(request), { code: "failed-precondition" });
    assert.equal(
      calls.some((call) => call[0] === "generate"),
      false,
    );
  });
}
