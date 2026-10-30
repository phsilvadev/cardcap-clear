const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createTenantOrders } = require("./tenant-orders.cjs");
class HttpsError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}
function fixture() {
  let clock = 1000000;
  let serial = Promise.resolve();
  let sequence = 0;
  const records = new Map();
  const stamp = () => {
    const value = clock;
    return { toMillis: () => value };
  };
  const doc = (path) => ({
    path,
    id: path.split("/").at(-1),
    get: async () => snapshot(path),
  });
  const snapshot = (path) => ({
    id: path.split("/").at(-1),
    ref: doc(path),
    exists: records.has(path),
    data: () => records.get(path),
  });
  function collection(path, filters = [], max = Infinity, cursor = "") {
    return {
      path,
      query: true,
      doc: (id) => doc(`${path}/${id}`),
      where: (key, op, value) =>
        collection(path, [...filters, [key, op, value]], max, cursor),
      orderBy: () => collection(path, filters, max, cursor),
      limit: (count) => collection(path, filters, count, cursor),
      startAfter: (value) => collection(path, filters, max, value.id),
      get: async () => {
        let docs = [...records.keys()]
          .filter(
            (key) =>
              key.startsWith(`${path}/`) &&
              key.split("/").length === path.split("/").length + 1,
          )
          .map(snapshot)
          .filter((item) =>
            filters.every(([key, op, value]) =>
              op === "in"
                ? value.includes(item.data()[key])
                : item.data()[key] === value,
            ),
          );
        if (cursor)
          docs = docs.slice(docs.findIndex((item) => item.id === cursor) + 1);
        docs = docs.slice(0, max);
        return { docs, size: docs.length };
      },
    };
  }
  const db = {
    doc,
    collection,
    runTransaction: (action) => {
      const run = serial.then(async () => {
        const writes = [];
        let writing = false;
        const result = await action({
          get: async (ref) => {
            assert.equal(
              writing,
              false,
              "Firestore requires reads before writes",
            );
            return ref.query ? ref.get() : snapshot(ref.path);
          },
          update: (ref, data) => {
            writing = true;
            assert(records.has(ref.path));
            writes.push([ref.path, { ...records.get(ref.path), ...data }]);
          },
          set: (ref, data, options) => {
            writing = true;
            writes.push([
              ref.path,
              { ...(options?.merge ? records.get(ref.path) : {}), ...data },
            ]);
          },
          create: (ref, data) => {
            writing = true;
            assert(!records.has(ref.path));
            writes.push([ref.path, data]);
          },
        });
        for (const [path, value] of writes) records.set(path, value);
        return result;
      });
      serial = run.catch(() => {});
      return run;
    },
  };
  for (const id of ["ownerA", "ownerB"]) {
    records.set(`tenants/${id}`, {
      ownerUid: id,
      status: "active",
      name: id,
      operations: { ownDelivery: true },
    });
    records.set(`tenants/${id}/orders/order1`, {
      storeId: id,
      customer: "Ana",
      items: "1 × Prato",
      total: 1000,
      status: "new",
      createdAt: stamp(),
    });
    records.set(`tenants/${id}/printing/settings`, {
      deviceId: "deviceA",
      deviceName: "Caixa",
      autoAccept: false,
    });
  }
  const service = createTenantOrders({
    db,
    HttpsError,
    timestamp: stamp,
    now: () => clock,
    uuid: () => `token-${++sequence}`,
  });
  const call = (action, fields = {}, uid = "ownerA") =>
    service.handler({
      auth: { uid },
      data: { storeId: "ownerA", action, ...fields },
    });
  return {
    records,
    call,
    service,
    tick: (milliseconds) => {
      clock += milliseconds;
    },
  };
}
test("todas as operações recusam acesso entre restaurantes e sessão ausente", async () => {
  const { call, service } = fixture();
  for (const action of [
    "inspect",
    "list",
    "setAutoAccept",
    "setDevice",
    "transition",
    "assignCourier",
    "claim",
    "start",
    "finish",
    "retry",
  ])
    await assert.rejects(call(action, {}, "ownerB"), {
      code: "permission-denied",
    });
  await assert.rejects(
    service.handler({ data: { storeId: "ownerA", action: "list" } }),
    { code: "unauthenticated" },
  );
});
test("aceites concorrentes criam apenas uma comanda com dados do servidor", async () => {
  const { records, call } = fixture();
  await Promise.all([
    call("transition", {
      orderId: "order1",
      expected: "new",
      target: "preparing",
      order: { total: 1 },
    }),
    call("transition", {
      orderId: "order1",
      expected: "new",
      target: "preparing",
    }),
  ]);
  const job = records.get("tenants/ownerA/printJobs/kitchen-order1");
  assert.equal(job.receipt.total, 1000);
  assert.equal(job.state, "queued");
  assert.equal(job.attempt, 1);
  assert.equal(records.get("tenants/ownerB/orders/order1").status, "new");
});
test("somente o computador escolhido reserva e duas chamadas não imprimem a mesma comanda", async () => {
  const { call } = fixture();
  await call("transition", {
    orderId: "order1",
    expected: "new",
    target: "preparing",
  });
  assert.equal(
    (await call("claim", { deviceId: "deviceB" })).designated,
    false,
  );
  const claims = await Promise.all([
    call("claim", { deviceId: "deviceA" }),
    call("claim", { deviceId: "deviceA" }),
  ]);
  assert.equal(claims.filter((result) => result.job).length, 1);
});
test("reserva expirada troca token e rejeita o computador anterior", async () => {
  const { call, tick } = fixture();
  await call("transition", {
    orderId: "order1",
    expected: "new",
    target: "preparing",
  });
  const first = (await call("claim", { deviceId: "deviceA" })).job;
  await call("setDevice", {
    deviceId: "deviceB",
    deviceName: "Cozinha",
    expectedDeviceId: "deviceA",
  });
  await assert.rejects(call("start", { ...first, deviceId: "deviceA" }), {
    code: "failed-precondition",
  });
  tick(31000);
  const second = (await call("claim", { deviceId: "deviceB" })).job;
  assert.notEqual(first.claimToken, second.claimToken);
  await assert.rejects(call("start", { ...first, deviceId: "deviceA" }), {
    code: "permission-denied",
  });
});
test("após início não há retomada automática; reenvio exige revisão e outro número de tentativa", async () => {
  const { call, tick } = fixture();
  await call("transition", {
    orderId: "order1",
    expected: "new",
    target: "preparing",
  });
  const job = (await call("claim", { deviceId: "deviceA" })).job;
  await call("start", { ...job, deviceId: "deviceA" });
  await assert.rejects(call("start", { ...job, deviceId: "deviceA" }), {
    code: "failed-precondition",
  });
  tick(31000);
  assert.equal((await call("claim", { deviceId: "deviceA" })).job, null);
  await assert.rejects(call("retry", { jobId: job.jobId, confirmed: true }), {
    code: "failed-precondition",
  });
  await call("finish", { ...job, deviceId: "deviceA", result: "uncertain" });
  await assert.rejects(call("retry", { jobId: job.jobId, confirmed: false }), {
    code: "failed-precondition",
  });
  await call("retry", { jobId: job.jobId, confirmed: true });
  const second = (await call("claim", { deviceId: "deviceA" })).job;
  assert.equal(second.attempt, 2);
  assert.notEqual(second.payload.id, job.payload.id);
});
test("cancelamento bloqueia comanda reservada e resultado exige token correto", async () => {
  const { call } = fixture();
  await call("transition", {
    orderId: "order1",
    expected: "new",
    target: "preparing",
  });
  const job = (await call("claim", { deviceId: "deviceA" })).job;
  await assert.rejects(
    call("finish", { ...job, deviceId: "deviceB", result: "submitted" }),
    { code: "permission-denied" },
  );
  await call("transition", {
    orderId: "order1",
    expected: "preparing",
    target: "cancelled",
    reason: "Cliente desistiu",
  });
  await assert.rejects(call("start", { ...job, deviceId: "deviceA" }), {
    code: "failed-precondition",
  });
  assert.equal((await call("claim", { deviceId: "deviceA" })).job, null);
});
test("aceite automático respeita configuração no servidor e gera fila sem painel aberto", async () => {
  const { records, service, call } = fixture();
  await service.autoAccept("ownerA", "order1");
  assert.equal(records.get("tenants/ownerA/orders/order1").status, "new");
  await call("setAutoAccept", { enabled: true });
  assert.equal(records.get("tenants/ownerA/orders/order1").status, "preparing");
  records.set("tenants/ownerA/orders/order2", {
    ...records.get("tenants/ownerA/orders/order1"),
    status: "new",
  });
  await service.autoAccept("ownerA", "order2");
  assert(records.has("tenants/ownerA/printJobs/kitchen-order2"));
});
test("confirmação concluída é idempotente e alterações concorrentes de impressora são recusadas", async () => {
  const { call } = fixture();
  await call("transition", {
    orderId: "order1",
    expected: "new",
    target: "preparing",
  });
  const job = (await call("claim", { deviceId: "deviceA" })).job;
  await call("start", { ...job, deviceId: "deviceA" });
  await call("finish", { ...job, deviceId: "deviceA", result: "submitted" });
  await call("finish", { ...job, deviceId: "deviceA", result: "submitted" });
  assert.equal((await call("claim", { deviceId: "deviceA" })).job, null);
  await assert.rejects(
    call("setDevice", {
      deviceId: "deviceB",
      deviceName: "Cozinha",
      expectedDeviceId: "",
    }),
    { code: "aborted" },
  );
});

test("reserva sem início não pode ser confirmada como enviada", async () => {
  const { call } = fixture();
  await call("transition", {
    orderId: "order1",
    expected: "new",
    target: "preparing",
  });
  const job = (await call("claim", { deviceId: "deviceA" })).job;
  await assert.rejects(
    call("finish", { ...job, deviceId: "deviceA", result: "submitted" }),
    { code: "failed-precondition" },
  );
});
