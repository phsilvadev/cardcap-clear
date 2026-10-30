const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createStoreLogoHandler, decodeLogo } = require("./store-logo.cjs");
class HttpsError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}
const png =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==";
function fixture() {
  let tenant = {
    ownerUid: "owner",
    status: "active",
    name: "Loja",
    logoPath: "tenants/owner/branding/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.png",
  };
  let fail = false;
  let counter = 0;
  const uploads = [];
  const deleted = [];
  const updates = [];
  const ref = {
    path: "tenants/owner",
    get: async () => ({ data: () => tenant }),
  };
  const handler = createStoreLogoHandler({
    HttpsError,
    timestamp: () => 123,
    uuid: () =>
      `bbbbbbbb-bbbb-cccc-dddd-${String(++counter).padStart(12, "0")}`,
    db: {
      doc: (path) => {
        assert.equal(path, ref.path);
        return ref;
      },
      runTransaction: async (action) => {
        if (fail) throw new Error("unavailable");
        return action({
          get: async () => ({ data: () => tenant }),
          update: (_ref, fields) => {
            updates.push(fields);
            tenant = { ...tenant, ...fields };
          },
        });
      },
    },
    bucket: {
      name: "demo-bucket",
      file: (path) => ({
        save: async (bytes, options) => uploads.push({ path, bytes, options }),
        delete: async () => deleted.push(path),
      }),
    },
  });
  const request = {
    auth: { uid: "owner" },
    data: { storeId: "owner", base64: png, contentType: "image/png" },
  };
  return {
    handler,
    request,
    uploads,
    deleted,
    updates,
    fail: () => {
      fail = true;
    },
    suspend: () => {
      tenant.status = "pending";
    },
  };
}
test("valida tipo, assinatura e tamanho sem aceitar SVG ou conteúdo arbitrário", () => {
  assert(decodeLogo(png, "image/png", HttpsError).length > 0);
  for (const [base64, type] of [
    [png, "image/jpeg"],
    [Buffer.from("<svg></svg>").toString("base64"), "image/svg+xml"],
    ["!!!!", "image/png"],
    ["", "image/png"],
    ["a".repeat(3 * 1024 * 1024), "image/png"],
  ])
    assert.throws(() => decodeLogo(base64, type, HttpsError), {
      code: "invalid-argument",
    });
});
test("somente dono pode fazer upload na sua loja", async () => {
  const f = fixture();
  await assert.rejects(f.handler({ ...f.request, auth: undefined }), {
    code: "unauthenticated",
  });
  await assert.rejects(f.handler({ ...f.request, auth: { uid: "other" } }), {
    code: "permission-denied",
  });
  assert.equal(f.uploads.length, 0);
  f.suspend();
  await assert.rejects(f.handler(f.request), { code: "permission-denied" });
});
test("salva imagem no caminho da loja e preserva demais dados", async () => {
  const f = fixture();
  const result = await f.handler(f.request);
  assert(result.logoPath.startsWith("tenants/owner/branding/"));
  assert(
    result.logoUrl.startsWith(
      "https://firebasestorage.googleapis.com/v0/b/demo-bucket/o/",
    ),
  );
  assert.equal(f.uploads[0].options.metadata.contentType, "image/png");
  assert.deepEqual(Object.keys(f.updates[0]).sort(), [
    "logoPath",
    "logoUrl",
    "updatedAt",
  ]);
  assert(
    f.deleted.includes(
      "tenants/owner/branding/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.png",
    ),
  );
});
test("falha ao atualizar cadastro limpa o novo arquivo e mantém o anterior", async () => {
  const f = fixture();
  f.fail();
  await assert.rejects(f.handler(f.request));
  assert.equal(f.uploads.length, 1);
  assert.deepEqual(f.deleted, [f.uploads[0].path]);
  assert.equal(f.updates.length, 0);
});
test("remoção limpa somente a logo do próprio restaurante", async () => {
  const f = fixture();
  const result = await f.handler({
    ...f.request,
    data: { storeId: "owner", remove: true },
  });
  assert.deepEqual(result, { logoPath: null, logoUrl: null });
  assert.equal(f.uploads.length, 0);
  assert.equal(f.deleted.length, 1);
});
