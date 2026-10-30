const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createLoginTransfer } = require("./login-transfer.cjs");
class HttpsError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}
function fixture() {
  let time = 1000000;
  let disabled = false;
  let revoked = 0;
  let serial = Promise.resolve();
  const rows = new Map([
    [
      "tenants/owner",
      { ownerUid: "owner", slug: "hero-burger", status: "active" },
    ],
    ["tenantDomains/hero-burger", { tenantId: "owner" }],
  ]);
  const snapshot = (path) => ({ data: () => rows.get(path) });
  const doc = (path) => ({
    path,
    get: async () => snapshot(path),
    create: async (value) => {
      assert(!rows.has(path));
      rows.set(path, value);
    },
  });
  const db = {
    doc,
    runTransaction: (action) => {
      const run = serial.then(() =>
        action({
          get: async (ref) => snapshot(ref.path),
          delete: (ref) => rows.delete(ref.path),
        }),
      );
      serial = run.catch(() => {});
      return run;
    },
  };
  const handler = createLoginTransfer({
    db,
    HttpsError,
    now: () => time,
    auth: {
      getUser: async () => ({
        disabled,
        tokensValidAfterTime: new Date(revoked).toISOString(),
      }),
      createCustomToken: async (uid) => `custom-${uid}`,
    },
    baseDomain: "example.com",
    centralOrigin: "https://example.com",
  });
  const create = (
    sourceOrigin = "http://localhost:3001",
    origin = sourceOrigin,
  ) =>
    handler({
      auth: { uid: "owner", token: { auth_time: 1000 } },
      rawRequest: { headers: { origin } },
      data: { action: "create", sourceOrigin },
    });
  const redeem = (code, origin = "http://hero-burger.localhost:3001") =>
    handler({
      rawRequest: { headers: { origin } },
      data: { action: "redeem", code },
    });
  return {
    rows,
    handler,
    create,
    redeem,
    expire: () => {
      time += 61000;
    },
    disable: () => {
      disabled = true;
    },
    revoke: () => {
      revoked = 1001000;
    },
  };
}
test("transfere ao subdomínio correto e mantém a porta; código não contém credenciais", async () => {
  const { create, redeem } = fixture();
  const transfer = await create();
  assert.equal(transfer.destinationOrigin, "http://hero-burger.localhost:3001");
  assert.match(transfer.code, /^[a-f0-9]{64}$/);
  assert.deepEqual(await redeem(transfer.code), {
    customToken: "custom-owner",
    slug: "hero-burger",
  });
});
test("código é de uso único mesmo com tentativas concorrentes", async () => {
  const { create, redeem } = fixture();
  const { code } = await create();
  const results = await Promise.allSettled([redeem(code), redeem(code)]);
  assert.equal(results.filter((item) => item.status === "fulfilled").length, 1);
});
test("recusa outro subdomínio, porta diferente e origem externa sem consumir código", async () => {
  const { create, redeem } = fixture();
  const { code } = await create();
  for (const origin of [
    "http://outra-loja.localhost:3001",
    "http://hero-burger.localhost:3002",
    "https://evil.example",
  ])
    await assert.rejects(redeem(code, origin), { code: "permission-denied" });
  assert.equal((await redeem(code)).slug, "hero-burger");
});
test("recusa código expirado, conta desativada e sessão revogada", async () => {
  for (const action of ["expire", "disable", "revoke"]) {
    const data = fixture();
    const { code } = await data.create();
    data[action]();
    await assert.rejects(data.redeem(code));
  }
});
test("emissão exige dono, domínio vinculado e origem central autorizada", async () => {
  const { handler, create, rows } = fixture();
  await assert.rejects(handler({ data: { action: "create" } }), {
    code: "unauthenticated",
  });
  await assert.rejects(create("https://evil.example"), {
    code: "permission-denied",
  });
  await assert.rejects(
    create("http://localhost:3001", "http://evil.localhost:3001"),
    { code: "permission-denied" },
  );
  rows.set("tenantDomains/hero-burger", { tenantId: "other" });
  await assert.rejects(create(), { code: "permission-denied" });
});
test("produção usa somente domínio configurado e HTTPS", async () => {
  const { create, redeem } = fixture();
  const data = await create("https://example.com");
  assert.equal(data.destinationOrigin, "https://hero-burger.example.com");
  assert.equal(
    (await redeem(data.code, data.destinationOrigin)).slug,
    "hero-burger",
  );
  await assert.rejects(create("http://example.com"));
});
