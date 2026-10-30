const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createSalon } = require("./salon.cjs");
const { createTenantOrders } = require("./tenant-orders.cjs");
class HttpsError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}
function fixture() {
  const records = new Map(),
    users = new Map();
  let serial = Promise.resolve(),
    clock = 1000000;
  const snapshot = (path) => ({
    id: path.split("/").at(-1),
    ref: doc(path),
    exists: records.has(path),
    data: () => records.get(path),
  });
  const doc = (path) => ({
    path,
    id: path.split("/").at(-1),
    get: async () => snapshot(path),
  });
  function collection(path, filters = [], count = Infinity) {
    return {
      doc: (id) => doc(path + "/" + id),
      where: (key, op, value) =>
        collection(path, [...filters, [key, op, value]], count),
      orderBy: () => collection(path, filters, count),
      limit: (size) => collection(path, filters, size),
      get: async () => {
        const docs = [...records.keys()]
          .filter(
            (key) =>
              key.startsWith(path + "/") &&
              key.split("/").length === path.split("/").length + 1,
          )
          .map(snapshot)
          .filter((doc) =>
            filters.every(([key, _op, value]) => doc.data()[key] === value),
          )
          .slice(0, count);
        return { docs, size: docs.length };
      },
    };
  }
  const db = {
    doc,
    collection,
    runTransaction(action) {
      const run = serial.then(async () => {
        const writes = [];
        let writing = false;
        const tx = {
          get: async (ref) => {
            assert.equal(writing, false, "leitura após escrita na transação");
            return snapshot(ref.path);
          },
          create: (ref, value) => {
            assert.equal(records.has(ref.path), false, "criação duplicada");
            writing = true;
            writes.push(() => records.set(ref.path, structuredClone(value)));
          },
          set: (ref, value) => {
            writing = true;
            writes.push(() => records.set(ref.path, structuredClone(value)));
          },
          update: (ref, fields) => {
            writing = true;
            assert.ok(records.has(ref.path), "documento a atualizar existe");
            writes.push(() =>
              records.set(ref.path, {
                ...records.get(ref.path),
                ...structuredClone(fields),
              }),
            );
          },
          delete: (ref) => {
            writing = true;
            writes.push(() => records.delete(ref.path));
          },
        };
        const result = await action(tx);
        writes.forEach((write) => write());
        return result;
      });
      serial = run.catch(() => {});
      return run;
    },
  };
  const auth = {
    getUser: async (uid) =>
      users.get(uid) ?? {
        disabled: false,
        tokensValidAfterTime: "1970-01-01T00:00:00Z",
      },
  };
  const deps = {
    db,
    auth,
    HttpsError,
    timestamp: () => ({ toMillis: () => clock }),
    now: () => clock,
  };
  // Structured clone cannot clone methods; timestamps are opaque markers in these tests.
  deps.timestamp = () => clock;
  records.set("tenants/owner", {
    ownerUid: "owner",
    ownerName: "Dono",
    status: "active",
    operations: { salon: true, ownDelivery: true },
  });
  records.set("waiterAccounts/waiter", {
    storeId: "owner",
    employeeId: "waiter-record",
  });
  records.set("tenants/owner/employees/waiter-record", {
    uid: "waiter",
    storeId: "owner",
    role: "waiter",
    active: true,
    name: "Garçom",
  });
  records.set("tenants/owner/employees/cashier-record", {
    uid: "cashier",
    storeId: "owner",
    role: "attendant",
    active: true,
    name: "Caixa",
  });
  records.set("tenants/owner/products/burger", {
    storeId: "owner",
    name: "Burger",
    categoryId: "burgers",
    available: true,
    priceCents: 2990,
  });
  records.set("tenants/owner/categories/burgers", {
    storeId: "owner",
    name: "Burgers",
  });
  const salon = createSalon(deps).handler,
    kitchen = createTenantOrders(deps).handler;
  let sequence = 0;
  const call = (uid, action, fields = {}) =>
    salon({
      auth: { uid, token: { auth_time: 1000 } },
      data: {
        action,
        storeId: "owner",
        ...fields,
        requestId: fields.requestId ?? `request-${++sequence}`,
      },
    });
  async function open() {
    const table = await call("owner", "createTable", { name: "Mesa 01" });
    const tab = await call("waiter", "open", {
      tableId: table.tableId,
      guests: 2,
    });
    return { tableId: table.tableId, tabId: tab.tabId };
  }
  async function order(context) {
    const result = await call("waiter", "send", {
      ...context,
      items: [{ productId: "burger", quantity: 2, priceCents: 1 }],
      notes: "Sem cebola",
    });
    return result.orderId;
  }
  async function prepare(orderId) {
    const request = (expected, target) =>
      kitchen({
        auth: { uid: "owner" },
        data: {
          action: "transition",
          storeId: "owner",
          orderId,
          expected,
          target,
        },
      });
    await request("new", "preparing");
    await request("preparing", "delivery");
  }
  return { records, users, call, salon, kitchen, open, order, prepare };
}
test("fluxo real: garçom, cozinha, conta, pagamentos parciais, encerramento e limpeza", async () => {
  const f = fixture(),
    context = await f.open(),
    orderId = await f.order(context);
  assert.equal(
    f.records.get(`tenants/owner/orders/${orderId}`).total,
    5980,
    "preço vem do servidor",
  );
  await assert.rejects(f.call("waiter", "requestBill", context), {
    code: "failed-precondition",
  });
  await f.prepare(orderId);
  await f.call("waiter", "serve", { ...context, orderId });
  await f.call("waiter", "requestBill", context);
  assert.equal(
    f.records.get(`tenants/owner/salonTables/${context.tableId}`).status,
    "bill_requested",
  );
  await assert.rejects(
    f.call("waiter", "payment", {
      ...context,
      amountCents: 100,
      method: "cash",
    }),
    { code: "permission-denied" },
  );
  await f.call("owner", "setPermissions", {
    employeeId: "cashier-record",
    receivePayments: true,
    discounts: false,
  });
  await assert.rejects(
    f.call("cashier", "discount", {
      ...context,
      amountCents: 980,
      reason: "Autorizado",
    }),
    { code: "permission-denied" },
  );
  await f.call("owner", "discount", {
    ...context,
    amountCents: 980,
    reason: "Autorizado pelo dono",
  });
  await f.call("cashier", "payment", {
    ...context,
    amountCents: 2000,
    method: "pix",
    payer: "Pessoa 1",
  });
  await assert.rejects(f.call("cashier", "close", context), {
    code: "failed-precondition",
  });
  await f.call("cashier", "payment", {
    ...context,
    amountCents: 3000,
    method: "card",
    payer: "Pessoa 2",
  });
  await f.call("cashier", "close", context);
  assert.equal(
    f.records.get(`tenants/owner/salonTables/${context.tableId}`).status,
    "awaiting_cleaning",
  );
  await assert.rejects(
    f.call("waiter", "open", { tableId: context.tableId, guests: 2 }),
    { code: "failed-precondition" },
  );
  await f.call("waiter", "clean", context);
  assert.equal(
    f.records.get(`tenants/owner/salonTables/${context.tableId}`).status,
    "available",
  );
  assert.equal(
    f.records.get(`tenants/owner/salonTabs/${context.tabId}`).status,
    "closed",
  );
  assert.equal(
    f.records.get(`tenants/owner/orders/${orderId}`).salonActive,
    false,
  );
});
test("idempotência e concorrência impedem duplicar pedidos, pagamentos e receber acima do saldo", async () => {
  const f = fixture(),
    context = await f.open();
  const order = {
    ...context,
    items: [{ productId: "burger", quantity: 1 }],
    requestId: "same-order-request",
  };
  const first = await f.call("waiter", "send", order),
    second = await f.call("waiter", "send", order);
  assert.equal(first.orderId, second.orderId);
  await f.prepare(first.orderId);
  await f.call("waiter", "serve", { ...context, orderId: first.orderId });
  await f.call("waiter", "requestBill", context);
  const payment = {
    ...context,
    amountCents: 2990,
    method: "cash",
    requestId: "same-payment-request",
  };
  await Promise.all([
    f.call("owner", "payment", payment),
    f.call("owner", "payment", payment),
  ]);
  const tab = f.records.get(`tenants/owner/salonTabs/${context.tabId}`);
  assert.equal(tab.payments.length, 1);
  assert.equal(tab.paidCents, 2990);
  await assert.rejects(
    f.call("owner", "payment", { ...payment, amountCents: 1 }),
    { code: "already-exists" },
  );
  await assert.rejects(
    f.call("owner", "payment", {
      ...payment,
      requestId: "another-payment",
      amountCents: 1,
    }),
    { code: "invalid-argument" },
  );
});
test("pagamentos simultâneos diferentes respeitam o saldo de forma atômica", async () => {
  const f = fixture(),
    context = await f.open(),
    orderId = await f.order(context);
  await f.prepare(orderId);
  await f.call("waiter", "serve", { ...context, orderId });
  await f.call("waiter", "requestBill", context);
  const result = await Promise.allSettled([
    f.call("owner", "payment", {
      ...context,
      amountCents: 4000,
      method: "pix",
    }),
    f.call("owner", "payment", {
      ...context,
      amountCents: 4000,
      method: "pix",
    }),
  ]);
  assert.equal(result.filter((item) => item.status === "fulfilled").length, 1);
  assert.equal(
    f.records.get(`tenants/owner/salonTabs/${context.tabId}`).paidCents,
    4000,
  );
});
test("nega acesso entre restaurantes, funcionário inativo, acesso revogado e módulo desligado", async () => {
  const f = fixture();
  await assert.rejects(f.salon({ data: { action: "list" } }), {
    code: "unauthenticated",
  });
  await assert.rejects(
    f.salon({
      auth: { uid: "waiter", token: { auth_time: 1000 } },
      data: { action: "list", storeId: "another" },
    }),
    { code: "permission-denied" },
  );
  f.users.set("waiter", {
    disabled: false,
    tokensValidAfterTime: new Date(2000000).toISOString(),
  });
  await assert.rejects(f.call("waiter", "list"), { code: "permission-denied" });
  f.users.clear();
  f.records.get("tenants/owner/employees/waiter-record").active = false;
  await assert.rejects(f.call("waiter", "list"), { code: "permission-denied" });
  f.records.get("tenants/owner").operations.salon = false;
  await assert.rejects(f.call("owner", "list"), { code: "permission-denied" });
});
test("comanda antiga não altera uma nova ocupação da mesma mesa", async () => {
  const f = fixture(),
    old = await f.open();
  await f.call("waiter", "cancelEmpty", old);
  const next = await f.call("waiter", "open", {
    tableId: old.tableId,
    guests: 3,
  });
  await assert.rejects(f.call("waiter", "clean", old), {
    code: "failed-precondition",
  });
  assert.notEqual(next.tabId, old.tabId);
});
test("cancelar pedido atualiza a conta e anular registro preserva histórico", async () => {
  const f = fixture(),
    context = await f.open(),
    orderId = await f.order(context);
  await f.kitchen({
    auth: { uid: "owner" },
    data: {
      action: "transition",
      storeId: "owner",
      orderId,
      expected: "new",
      target: "cancelled",
      reason: "Cliente desistiu",
    },
  });
  const tab = f.records.get(`tenants/owner/salonTabs/${context.tabId}`);
  assert.equal(tab.subtotalCents, 0);
  assert.deepEqual(tab.lines, []);
  const second = await f.order(context);
  await f.prepare(second);
  await f.call("waiter", "serve", { ...context, orderId: second });
  await f.call("waiter", "requestBill", context);
  const payment = await f.call("owner", "payment", {
    ...context,
    amountCents: 1000,
    method: "pix",
  });
  await f.call("owner", "voidPayment", {
    ...context,
    paymentId: payment.paymentId,
    reason: "Registro incorreto",
  });
  const after = f.records.get(`tenants/owner/salonTabs/${context.tabId}`);
  assert.equal(after.paidCents, 0);
  assert.equal(after.payments[0].voided, true);
  assert.ok(after.payments[0].voidReason);
});
