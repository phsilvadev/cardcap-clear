const test = require("node:test");
const assert = require("node:assert/strict");
const { createCustomer } = require("./customer.cjs");
const {
  fixture: checkoutFixture,
  prepare,
  HttpsError,
} = require("../../tests/support/checkout-fixture.cjs");
function fixture() {
  const checkout = checkoutFixture(),
    { db, data } = checkout;
  const users = new Map([
    [
      "alice",
      {
        uid: "alice",
        email: "alice@example.com",
        emailVerified: false,
        tokensValidAfterTime: "1970-01-01T00:00:00Z",
      },
    ],
    [
      "bob",
      {
        uid: "bob",
        email: "bob@example.com",
        emailVerified: true,
        tokensValidAfterTime: "1970-01-01T00:00:00Z",
      },
    ],
  ]);
  function collection(path, cursor, count = Infinity) {
    return {
      orderBy: () => collection(path, cursor, count),
      startAfter: (createdAtMs, id) =>
        collection(path, { createdAtMs, id }, count),
      limit: (count) => collection(path, cursor, count),
      get: async () => ({
        docs: [...data.entries()]
          .filter(
            ([key]) =>
              key.startsWith(path + "/") &&
              key.split("/").length === path.split("/").length + 1,
          )
          .map(([key, value]) => ({
            id: key.split("/").at(-1),
            data: () => value,
          }))
          .sort(
            (a, b) =>
              b.data().createdAtMs - a.data().createdAtMs ||
              b.id.localeCompare(a.id),
          )
          .filter(
            (doc) =>
              !cursor ||
              doc.data().createdAtMs < cursor.createdAtMs ||
              (doc.data().createdAtMs === cursor.createdAtMs &&
                doc.id < cursor.id),
          )
          .slice(0, count),
      }),
    };
  }
  db.collection = collection;
  const auth = { getUser: async (uid) => users.get(uid) };
  const customer = createCustomer({
    db,
    auth,
    HttpsError,
    timestamp: () => 123,
    uuid: () => "address-one",
  });
  const call = (action, values = {}, uid = "alice") =>
    customer.handler({
      data: { ...values, action },
      auth: uid ? { uid, token: { auth_time: 100 } } : null,
    });
  return { ...checkout, customer, call, users };
}
const address = {
  label: "Casa",
  street: "Rua Um",
  number: "10",
  complement: "",
  neighborhood: "Centro",
  city: "São Paulo",
  state: "sp",
  zip: "01001-000",
  isDefault: true,
};
test("perfil usa identidade verificada e ignora UID, e-mail e privilégios enviados pelo cliente", async () => {
  const f = fixture();
  const saved = await f.call("saveProfile", {
    name: "Alice Silva",
    phone: "(11) 99999-0000",
    uid: "bob",
    email: "fake@attacker.com",
    role: "admin",
  });
  assert.equal(saved.uid, "alice");
  assert.equal(saved.email, "alice@example.com");
  assert.equal(saved.phone, "11999990000");
  assert.equal(f.data.has("customers/bob"), false);
  assert.equal(f.data.get("customers/alice").role, undefined);
  assert.equal((await f.call("profile", {}, "bob")).name, "");
});
test("exige autenticação e bloqueia contas desativadas e sessões revogadas", async () => {
  const f = fixture();
  await assert.rejects(f.call("profile", {}, null), {
    code: "unauthenticated",
  });
  f.users.get("alice").disabled = true;
  await assert.rejects(f.call("saveProfile", { name: "Alice", phone: "" }), {
    code: "unauthenticated",
  });
  f.users.get("alice").disabled = false;
  f.users.get("alice").tokensValidAfterTime = "2026-11-01T00:00:00Z";
  await assert.rejects(f.call("profile"), { code: "unauthenticated" });
});
test("endereços são isolados, validados e têm somente um principal; limite de cinco", async () => {
  const f = fixture();
  await assert.rejects(
    f.call("saveAddress", { address: { ...address, zip: "123", state: "ZZ" } }),
    { code: "invalid-argument" },
  );
  for (let index = 0; index < 5; index++)
    await f.call("saveAddress", {
      address: { ...address, id: `address-${index}` },
    });
  assert.equal(
    (await f.call("profile")).addresses.filter((item) => item.isDefault).length,
    1,
  );
  await assert.rejects(
    f.call("saveAddress", { address: { ...address, id: "address-six" } }),
    { code: "resource-exhausted" },
  );
  await f.call("deleteAddress", { id: "address-4" });
  assert.equal(
    (await f.call("profile")).addresses.filter((item) => item.isDefault).length,
    1,
  );
  assert.equal((await f.call("profile", {}, "bob")).addresses.length, 0);
});
test("favoritos usam nome confiável, não duplicam e são removidos sem afetar outro cliente", async () => {
  const f = fixture();
  f.data.get("tenants/store").name = "Loja verdadeira";
  await f.call("favorite", { slug: "loja-teste", name: "Fake", remove: false });
  const saved = await f.call("favorite", { slug: "loja-teste", remove: false });
  assert.deepEqual(saved.favorites, [
    { slug: "loja-teste", name: "Loja verdadeira" },
  ]);
  assert.equal((await f.call("profile", {}, "bob")).favorites.length, 0);
  assert.equal(
    (await f.call("favorite", { slug: "loja-teste", remove: true })).favorites
      .length,
    0,
  );
});
test("checkout autenticado vincula compra no servidor; histórico acompanha o status real sem vazar pedidos", async () => {
  const f = fixture(),
    options = {
      pricingHash: (
        await f.checkout.handler({ data: { ...f.input, action: "quote" } })
      ).pricingHash,
    };
  const receipt = await f.checkout.handler({
    data: { ...f.input, ...options, action: "create", customerUid: "bob" },
    auth: { uid: "alice" },
    rawRequest: { ip: "127.0.0.1" },
  });
  assert.equal(
    f.data.get(`tenants/store/orders/${receipt.id}`).customerUid,
    "alice",
  );
  assert.equal(f.data.has(`customers/bob/orders/${receipt.id}`), false);
  assert.equal((await f.call("orders")).orders[0].status, "new");
  f.data.get(`tenants/store/orders/${receipt.id}`).status = "preparing";
  assert.equal((await f.call("order", { id: receipt.id })).status, "preparing");
  await assert.rejects(f.call("order", { id: receipt.id }, "bob"), {
    code: "not-found",
  });
  assert.deepEqual((await f.call("orders", {}, "bob")).orders, []);
  // Even a malformed server pointer must not grant another customer's purchase.
  f.data.set(
    `customers/bob/orders/${receipt.id}`,
    f.data.get(`customers/alice/orders/${receipt.id}`),
  );
  await assert.rejects(f.call("order", { id: receipt.id }, "bob"), {
    code: "permission-denied",
  });
});
test("compra de visitante continua sem ser vinculada automaticamente a outra conta", async () => {
  const f = fixture(),
    options = {
      pricingHash: (
        await f.checkout.handler({ data: { ...f.input, action: "quote" } })
      ).pricingHash,
    };
  const receipt = await f.checkout.handler({
    data: { ...f.input, ...options, action: "create", customerUid: "alice" },
    rawRequest: { ip: "127.0.0.1" },
  });
  assert.equal(
    f.data.get(`tenants/store/orders/${receipt.id}`).customerUid,
    null,
  );
  assert.deepEqual((await f.call("orders")).orders, []);
});
test("paginação é limitada a vinte compras e não repete a página seguinte", async () => {
  const f = fixture();
  for (let i = 0; i < 23; i++) {
    const id = `order-${String(i).padStart(3, "0")}`;
    f.data.set(`customers/alice/orders/${id}`, {
      storeId: "store",
      checkoutId: id,
      slug: "loja-teste",
      storeName: "Loja",
      createdAtMs: i,
    });
    f.data.set(`tenants/store/checkoutSessions/${id}`, {
      id,
      customerUid: "alice",
      customer: { address: "" },
      lines: [],
      paymentStatus: "awaiting_payment",
    });
  }
  const first = await f.call("orders"),
    second = await f.call("orders", { cursor: first.cursor });
  assert.equal(first.orders.length, 20);
  assert.equal(second.orders.length, 3);
  assert.equal(second.cursor, null);
  assert.equal(
    new Set([...first.orders, ...second.orders].map((item) => item.id)).size,
    23,
  );
});
