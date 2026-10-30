const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  createReceivingHandler,
  createStorefrontHandler,
} = require("./storefront.cjs");
class HttpsError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}
const active = {
  ownerUid: "owner",
  slug: "minha-loja",
  status: "active",
  name: "Minha Loja",
  city: "São Paulo",
  state: "SP",
  receivingOrders: true,
  deliveryFeeCents: 590,
  asaasWalletId: "private-wallet",
  ownerName: "Private Owner",
  contactEmail: "private@example.com",
  cnpj: "private-cnpj",
};
function fixture(records = {}) {
  const data = new Map(Object.entries(records));
  const reads = [];
  const queries = [];
  const snapshot = (path) => ({
    id: path.split("/").at(-1),
    data: () => data.get(path),
  });
  function collection(path) {
    const filters = [];
    let size = Infinity;
    let cursor = null;
    let order = null;
    const query = {
      where(key, _op, value) {
        filters.push([key, value]);
        return query;
      },
      orderBy(key) {
        order = key;
        return query;
      },
      startAfter(value) {
        cursor = value;
        return query;
      },
      limit(value) {
        size = value;
        return query;
      },
      async get() {
        queries.push({ path, filters, size, cursor });
        const docs = [...data.keys()]
          .filter(
            (key) =>
              key.startsWith(path + "/") &&
              key.split("/").length === path.split("/").length + 1,
          )
          .map(snapshot)
          .filter((doc) =>
            filters.every(([key, value]) => doc.data()[key] === value),
          )
          .sort((a, b) =>
            String(order === "name" ? a.data().name : a.id).localeCompare(
              String(order === "name" ? b.data().name : b.id),
            ),
          )
          .filter((doc) => !cursor || doc.id > cursor)
          .slice(0, size);
        return { docs };
      },
    };
    return query;
  }
  const db = {
    collection,
    doc(path) {
      return {
        path,
        async get() {
          reads.push(path);
          return snapshot(path);
        },
        collection: (sub) => collection(path + "/" + sub),
      };
    },
    async runTransaction(action) {
      return action({
        get: (ref) => ref.get(),
        update: (ref, fields) =>
          data.set(ref.path, { ...data.get(ref.path), ...fields }),
      });
    },
  };
  return { data, reads, queries, db };
}
const call = (data, uid) => ({ data, ...(uid ? { auth: { uid } } : {}) });
test("recebimento exige proprietário, grava só o estado e mantém a publicação separada", async () => {
  const f = fixture({ "tenants/owner": { ...active, status: "configured" } });
  const handler = createReceivingHandler({
    ...f,
    HttpsError,
    timestamp: () => 123,
  });
  await assert.rejects(
    handler(call({ storeId: "owner", receivingOrders: true })),
    { code: "unauthenticated" },
  );
  await assert.rejects(
    handler(call({ storeId: "owner", receivingOrders: true }, "another")),
    { code: "permission-denied" },
  );
  await assert.rejects(
    handler(call({ storeId: "owner", receivingOrders: "true" }, "owner")),
    { code: "invalid-argument" },
  );
  await assert.rejects(
    handler(call({ storeId: "../owner", receivingOrders: true }, "owner")),
    { code: "invalid-argument" },
  );
  assert.deepEqual(
    await handler(
      call(
        { storeId: "owner", receivingOrders: false, status: "active" },
        "owner",
      ),
    ),
    { receivingOrders: false },
  );
  assert.equal(f.data.get("tenants/owner").status, "configured");
  assert.equal(f.data.get("tenants/owner").receivingOrders, false);
  f.data.set("tenants/owner", { ...active, status: "blocked" });
  await assert.rejects(
    handler(call({ storeId: "owner", receivingOrders: true }, "owner")),
    { code: "permission-denied" },
  );
});
test("listagem pública filtra cidade sem acentos, oculta lojas não liberadas e campos privados", async () => {
  const f = fixture({
    "tenants/owner": active,
    "tenants/other": {
      ...active,
      ownerUid: "other",
      slug: "outra-loja",
      city: "Recife",
    },
    "tenants/pending": { ...active, ownerUid: "pending", status: "configured" },
    "tenants/malformed": { ...active, ownerUid: "wrong" },
  });
  const handler = createStorefrontHandler({ ...f, HttpsError });
  const result = await handler(
    call({ action: "list", city: "sao paulo", state: "SP" }),
  );
  assert.equal(result.stores.length, 1);
  assert.equal(result.stores[0].receivingOrders, true);
  assert.equal(result.stores[0].deliveryFeeCents, 590);
  for (const key of [
    "ownerUid",
    "ownerName",
    "contactEmail",
    "cnpj",
    "asaasWalletId",
    "status",
  ])
    assert.equal(key in result.stores[0], false);
  assert.equal(result.nextCursor, null);
  assert.equal(f.queries[0].size, 40);
  await assert.rejects(
    handler(
      call({ action: "list", city: "São Paulo", state: "SP", cursor: "../x" }),
    ),
    { code: "invalid-argument" },
  );
});
test("prévia de loja não publicada só pode ser consultada por seu proprietário", async () => {
  const f = fixture({
    "tenantDomains/minha-loja": { tenantId: "owner" },
    "tenants/owner": { ...active, status: "configured" },
  });
  const handler = createStorefrontHandler({ ...f, HttpsError });
  for (const [preview, uid] of [
    [false, undefined],
    [true, undefined],
    [true, "another"],
  ])
    await assert.rejects(
      handler(call({ action: "get", slug: "minha-loja", preview }, uid)),
      { code: "not-found" },
    );
  const result = await handler(
    call({ action: "get", slug: "minha-loja", preview: true }, "owner"),
  );
  assert.equal(result.preview, true);
  assert.equal(result.store.receivingOrders, false);
  f.data.set("tenants/owner", { ...active, slug: "outro-slug" });
  await assert.rejects(
    handler(call({ action: "get", slug: "minha-loja" }, "owner")),
    { code: "not-found" },
  );
});
test("cardápio expõe apenas produtos disponíveis da loja e imagens com caminho correto", async () => {
  const product = {
    storeId: "owner",
    name: "Burger",
    description: "Feito na hora",
    categoryId: "burgers",
    priceCents: 2990,
    available: true,
    internalSecret: "private",
  };
  const f = fixture({
    "tenantDomains/minha-loja": { tenantId: "owner" },
    "tenants/owner": active,
    "tenants/owner/categories/burgers": { storeId: "owner", name: "Burgers" },
    "tenants/owner/products/a": {
      ...product,
      imagePath: "tenants/owner/products/a/image",
    },
    "tenants/owner/products/b": {
      ...product,
      imagePath: "tenants/another/products/b/image",
    },
    "tenants/owner/products/c": { ...product, available: false },
    "tenants/owner/products/d": { ...product, storeId: "another" },
    "tenants/owner/products/e": { ...product, categoryId: "foreign-category" },
  });
  const images = [];
  const handler = createStorefrontHandler({
    ...f,
    HttpsError,
    imageUrl: async (path) => {
      images.push(path);
      return "https://example.com/image";
    },
  });
  const result = await handler(call({ action: "get", slug: "minha-loja" }));
  assert.deepEqual(
    result.products.map((item) => item.id),
    ["a", "b"],
  );
  assert.deepEqual(images, ["tenants/owner/products/a/image"]);
  assert.equal(result.products[1].imageUrl, null);
  assert.equal("internalSecret" in result.products[0], false);
  const before = f.queries.length;
  f.data.set("tenants/owner", { ...active, receivingOrders: false });
  const summary = await handler(
    call({ action: "summary", slug: "minha-loja" }),
  );
  assert.equal(summary.store.receivingOrders, false);
  assert.equal(f.queries.length, before);
});
test("paginação do catálogo preserva o cursor sem misturar restaurantes", async () => {
  const rows = {};
  for (let i = 0; i < 41; i++) {
    const id = `store${String(i).padStart(2, "0")}`;
    rows[`tenants/${id}`] = { ...active, ownerUid: id, slug: `loja-${i}` };
  }
  const handler = createStorefrontHandler({ ...fixture(rows), HttpsError });
  const first = await handler(
    call({ action: "list", city: "São Paulo", state: "SP" }),
  );
  assert.equal(first.stores.length, 40);
  assert.equal(first.nextCursor, "store39");
  const second = await handler(
    call({
      action: "list",
      city: "São Paulo",
      state: "SP",
      cursor: first.nextCursor,
    }),
  );
  assert.equal(second.stores.length, 1);
  assert.equal(second.stores[0].slug, "loja-40");
  assert.equal(second.nextCursor, null);
});
