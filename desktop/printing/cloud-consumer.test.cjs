const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createCloudConsumer } = require("./cloud-consumer.cjs");
function fixture(options = {}) {
  const calls = [];
  const paper = [];
  const saved = {};
  const session = { storeId: "ownerA", idToken: "private-token" };
  let claimed = false;
  const job = {
    jobId: "kitchen-order1",
    claimToken: "claim1",
    attempt: 1,
    payload: {
      id: "kitchen-order1:1",
      storeId: "ownerA",
      storeName: "Loja A",
      order: { id: "order1" },
    },
  };
  const consumer = createCloudConsumer({
    deviceId: "deviceA",
    deviceName: "Caixa",
    configured: () => true,
    submitted: () => false,
    loadInflight: () => options.inflight ?? {},
    saveInflight: (value) => {
      Object.assign(saved, JSON.parse(JSON.stringify(value)));
      assert(!JSON.stringify(value).includes("private-token"));
    },
    print: async (payload) => {
      paper.push(payload);
    },
    call: async (current, action, fields) => {
      calls.push({ current, action, fields });
      if (options.call) {
        const override = await options.call(current, action, fields, job);
        if (override) return override;
      }
      if (action === "inspect")
        return { storeId: current.storeId, storeName: "Loja" };
      if (action === "claim") {
        if (claimed) return { job: null, designated: true };
        claimed = true;
        return { job, designated: true };
      }
      return { ok: true };
    },
    ...options.dependencies,
  });
  return { consumer, calls, paper, session, job };
}
test("valida login, reserva e inicia antes de imprimir; desconectar interrompe novos envios", async () => {
  const { consumer, calls, paper, session } = fixture();
  await consumer.tick();
  assert.equal(calls.length, 0);
  await consumer.connect(session);
  await Promise.all([consumer.tick(), consumer.tick()]);
  assert.deepEqual(
    calls.map((item) => item.action),
    ["inspect", "claim", "start", "finish"],
  );
  assert.equal(paper.length, 1);
  assert.equal(calls.at(-1).fields.result, "submitted");
  consumer.disconnect();
  await consumer.tick();
  assert.equal(calls.length, 4);
  assert.equal(consumer.status().storeId, null);
});
test("comanda de outro restaurante não chega à impressora", async () => {
  const { consumer, paper, session } = fixture({
    call: async (_session, action, _fields, job) =>
      action === "claim"
        ? {
            job: { ...job, payload: { ...job.payload, storeId: "ownerB" } },
            designated: true,
          }
        : null,
  });
  await consumer.connect(session);
  await consumer.tick();
  assert.equal(paper.length, 0);
});
test("logout durante autorização impede impressão física", async () => {
  let disconnect;
  const { consumer, paper, calls, session } = fixture({
    call: async (_session, action) => {
      if (action === "start") disconnect();
    },
  });
  disconnect = () => consumer.disconnect();
  await consumer.connect(session);
  await consumer.tick();
  assert.equal(paper.length, 0);
  assert.equal(calls.at(-1).fields.result, "uncertain");
});
test("trocar de restaurante invalida uma validação de login antiga", async () => {
  let finish;
  const { consumer, session } = fixture({
    call: async (current, action) => {
      if (action === "inspect" && current.storeId === "ownerA")
        return new Promise((resolve) => {
          finish = () => resolve({ storeId: "ownerA" });
        });
    },
  });
  const old = consumer.connect(session);
  await consumer.connect({ storeId: "ownerB", idToken: "other-token" });
  finish();
  await old;
  assert.equal(consumer.status().storeId, "ownerB");
});
test("reinício confirma envio já registrado sem reimprimir", async () => {
  const inflight = {
    "ownerA:kitchen-order1": {
      storeId: "ownerA",
      jobId: "kitchen-order1",
      claimToken: "claim1",
      payloadId: "kitchen-order1:1",
    },
  };
  const { consumer, paper, calls, session } = fixture({
    inflight,
    dependencies: { submitted: () => true },
  });
  await consumer.connect(session);
  await consumer.tick();
  assert.equal(paper.length, 0);
  assert.equal(calls.at(-1).fields.result, "submitted");
  assert.equal(Object.keys(inflight).length, 0);
});
test("reinício com resultado desconhecido exige revisão", async () => {
  const inflight = {
    "ownerA:kitchen-order1": {
      storeId: "ownerA",
      jobId: "kitchen-order1",
      claimToken: "claim1",
      payloadId: "kitchen-order1:1",
    },
  };
  const { consumer, paper, calls, session } = fixture({ inflight });
  await consumer.connect(session);
  await consumer.tick();
  assert.equal(paper.length, 0);
  assert.equal(calls.at(-1).fields.result, "uncertain");
});
