const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createPrintQueue } = require("./queue.cjs");
const job = {
  id: "loja:1048:accepted",
  storeId: "owner",
  storeName: "Loja",
  order: {
    id: "1048",
    customer: "Ana",
    items: "Prato",
    total: 1000,
    status: "preparing",
    time: "Há 3 min",
  },
};
test("serializa duplicatas e envia apenas uma vez, inclusive após reiniciar", async () => {
  const journal = {};
  let prints = 0;
  let durable;
  const options = {
    journal,
    save: (value) => {
      durable = JSON.parse(JSON.stringify(value));
    },
    print: async () => {
      prints++;
    },
    confirmRetry: async () => true,
  };
  const queue = createPrintQueue(options);
  await Promise.all([queue(job), queue(job)]);
  await createPrintQueue({ ...options, journal: durable })(job);
  assert.equal(prints, 1);
});
test("falha não repete automaticamente e exige confirmação para reenviar", async () => {
  const journal = {};
  let prints = 0;
  let confirmed = false;
  const queue = createPrintQueue({
    journal,
    save: () => {},
    print: async () => {
      prints++;
      if (prints === 1) throw new Error("offline");
    },
    confirmRetry: async () => confirmed,
  });
  await assert.rejects(queue(job));
  await assert.rejects(queue(job));
  assert.equal(prints, 1);
  await assert.rejects(queue({ ...job, retry: true }));
  confirmed = true;
  await queue({ ...job, retry: true });
  assert.equal(prints, 2);
});
test("falha ao salvar registro impede impressão", async () => {
  let prints = 0;
  const queue = createPrintQueue({
    journal: {},
    save: () => {
      throw new Error("disk");
    },
    print: async () => {
      prints++;
    },
    confirmRetry: async () => true,
  });
  await assert.rejects(queue(job));
  assert.equal(prints, 0);
});
