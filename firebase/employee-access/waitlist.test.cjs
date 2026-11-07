const test = require("node:test");
const assert = require("node:assert/strict");
const { createWaitlistHandler } = require("./waitlist.cjs");
class HttpsError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}
function fixture(verifyTurnstile = async () => true) {
  const data = new Map();
  let clock = 1700000000000;
  let chain = Promise.resolve();
  const db = {
    doc: (path) => ({ path }),
    runTransaction: (fn) => {
      const task = chain.then(async () => {
        const staged = new Map(data);
        let writing = false;
        const tx = {
          get: async ({ path }) => {
            assert.equal(writing, false);
            return { exists: staged.has(path), data: () => staged.get(path) };
          },
          set: ({ path }, value) => {
            writing = true;
            staged.set(path, value);
          },
          create: ({ path }, value) => {
            writing = true;
            assert.equal(staged.has(path), false);
            staged.set(path, value);
          },
        };
        const result = await fn(tx);
        data.clear();
        for (const [key, value] of staged) data.set(key, value);
        return result;
      });
      chain = task.catch(() => {});
      return task;
    },
  };
  const handler = createWaitlistHandler({
    db,
    HttpsError,
    timestamp: () => new Date(clock),
    now: () => clock,
    verifyTurnstile,
  });
  const request = (email = "partner@example.com", extras = {}) => ({
    data: { email, consent: true, ...extras },
    rawRequest: { ip: "127.0.0.1" },
  });
  return {
    data,
    handler,
    request,
    advance: () => {
      clock += 900000;
    },
  };
}

test("Turnstile inválido impede qualquer gravação", async () => {
  const f = fixture(async () => false);
  await assert.rejects(() => f.handler(f.request()), {
    code: "permission-denied",
  });
  assert.equal(f.data.size, 0);
});
test("salva e-mail normalizado, origem e consentimento sem expor documentos", async () => {
  const f = fixture();
  assert.deepEqual(await f.handler(f.request(" PARTNER@EXAMPLE.COM ")), {
    accepted: true,
  });
  const entries = [...f.data].filter(([k]) => k.startsWith("launchWaitlist/"));
  assert.equal(entries.length, 1);
  const [path, lead] = entries[0];
  assert.ok(!path.includes("@"));
  assert.equal(lead.email, "partner@example.com");
  assert.equal(lead.source, "coming-soon");
  assert.equal(lead.consent.version, "launch-news-v1");
  assert.equal(lead.status, "subscribed");
});
test("envios simultâneos e repetidos não duplicam nem sobrescrevem uma inscrição", async () => {
  const f = fixture();
  await Promise.all([
    f.handler(f.request()),
    f.handler(f.request("PARTNER@example.com")),
  ]);
  const lead = [...f.data].find(([k]) => k.startsWith("launchWaitlist/"));
  f.advance();
  await f.handler(f.request());
  assert.deepEqual(f.data.get(lead[0]), lead[1]);
  assert.equal(
    [...f.data.keys()].filter((k) => k.startsWith("launchWaitlist/")).length,
    1,
  );
});
test("rejeita e-mail inválido, excesso de tamanho e falta de consentimento", async () => {
  const f = fixture();
  for (const request of [
    f.request("invalido"),
    f.request("a".repeat(250) + "@x.com"),
    f.request("p@example.com", { consent: false }),
    { data: null },
  ])
    await assert.rejects(() => f.handler(request), {
      code: "invalid-argument",
    });
  assert.equal(f.data.size, 0);
});
test("limita tentativas por janela e aceita novamente após o intervalo", async () => {
  const f = fixture();
  for (let i = 0; i < 5; i++)
    await f.handler(f.request(`partner${i}@example.com`));
  await assert.rejects(() => f.handler(f.request()), {
    code: "resource-exhausted",
  });
  f.advance();
  await f.handler(f.request());
  assert.equal(
    [...f.data.keys()].filter((k) => k.startsWith("launchWaitlist/")).length,
    6,
  );
});
test("campo de armadilha não cria inscrições", async () => {
  const f = fixture();
  assert.deepEqual(
    await f.handler(f.request("p@example.com", { website: "bot.example" })),
    { accepted: true },
  );
  assert.equal(f.data.size, 0);
});
