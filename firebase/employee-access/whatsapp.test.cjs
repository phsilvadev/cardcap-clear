const test = require("node:test");
const assert = require("node:assert/strict");
const {
  createWhatsAppHandler,
  instanceName,
  safeQr,
} = require("./whatsapp.cjs");
const { createEvolution } = require("./evolution.cjs");
class HttpsError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}
const png = "data:image/png;base64,iVBORw0KGgo=";
function fixture() {
  const data = new Map([
    ["tenants/owner", { ownerUid: "owner", status: "active" }],
    ["tenants/other", { ownerUid: "other", status: "active" }],
  ]);
  let chain = Promise.resolve(),
    clock = 1700000000000;
  const db = {
    doc: (path) => ({ path }),
    runTransaction: (fn) => {
      const task = chain.then(async () => {
        const staged = new Map(data);
        let writing = false;
        const result = await fn({
          get: async (ref) => {
            assert.equal(writing, false);
            return { data: () => staged.get(ref.path) };
          },
          set: (ref, values) => {
            writing = true;
            staged.set(ref.path, { ...staged.get(ref.path), ...values });
          },
        });
        data.clear();
        for (const entry of staged) data.set(...entry);
        return result;
      });
      chain = task.catch(() => {});
      return task;
    },
  };
  const calls = [];
  let state = "missing";
  const provider = {
    configured: () => true,
    state: async (instance) => {
      calls.push(["state", instance]);
      return state;
    },
    create: async (instance) => {
      calls.push(["create", instance]);
      state = "close";
      return { hash: "PRIVATE-TOKEN" };
    },
    connect: async (instance) => {
      calls.push(["connect", instance]);
      state = "connecting";
      return { base64: png, hash: "PRIVATE-TOKEN" };
    },
    disconnect: async (instance) => {
      calls.push(["disconnect", instance]);
      state = "missing";
    },
  };
  const handler = createWhatsAppHandler({
    db,
    HttpsError,
    provider,
    projectId: "project",
    timestamp: () => new Date(clock),
    now: () => clock,
  });
  const request = (action = "status", storeId = "owner") => ({
    auth: { uid: "owner" },
    data: { action, storeId },
  });
  return {
    data,
    provider,
    calls,
    handler,
    request,
    setState: (value) => {
      state = value;
    },
    advance: () => {
      clock += 60000;
    },
  };
}
test("somente proprietário de loja configurada ou ativa gerencia a instância", async () => {
  const f = fixture();
  for (const req of [
    { data: { action: "status", storeId: "owner" } },
    f.request("status", "other"),
  ])
    await assert.rejects(
      () => f.handler(req),
      (e) => ["unauthenticated", "permission-denied"].includes(e.code),
    );
  for (const status of ["pending", "suspended"]) {
    f.data.set("tenants/owner", { ownerUid: "owner", status });
    await assert.rejects(() => f.handler(f.request()), {
      code: "permission-denied",
    });
  }
  f.data.set("tenants/owner", { ownerUid: "other", status: "active" });
  await assert.rejects(() => f.handler(f.request()), {
    code: "permission-denied",
  });
  assert.equal(f.calls.length, 0);
});
test("instância é isolada por projeto e loja; cliente não escolhe outro nome", async () => {
  const f = fixture();
  assert.notEqual(
    instanceName("project", "owner"),
    instanceName("project", "other"),
  );
  assert.notEqual(
    instanceName("project", "owner"),
    instanceName("different", "owner"),
  );
  const req = f.request("connect");
  req.data.instanceName = "other-instance";
  const r = await f.handler(req);
  assert.equal(r.state, "connecting");
  assert.ok(
    f.calls.every(([, name]) => name === instanceName("project", "owner")),
  );
  assert.ok(!JSON.stringify(r).includes("PRIVATE-TOKEN"));
  assert.ok(!JSON.stringify([...f.data]).includes(png));
  assert.equal(r.qrCode, png);
});
test("status não cria conexão e QR Code aceita apenas PNG inline limitado", async () => {
  const f = fixture();
  assert.equal((await f.handler(f.request())).state, "disconnected");
  assert.equal(f.calls.length, 1);
  assert.equal(safeQr({ base64: "https://external/qr" }), null);
  assert.equal(safeQr({ base64: "data:image/svg+xml;base64,PHN2Zz4=" }), null);
  assert.equal(
    safeQr({ base64: "data:image/png;base64," + "A".repeat(200000) }),
    null,
  );
});
test("repetir conexão usa a mesma instância e remove QR ao conectar", async () => {
  const f = fixture();
  await f.handler(f.request("connect"));
  await f.handler(f.request("connect"));
  assert.equal(f.calls.filter(([action]) => action === "create").length, 1);
  f.setState("open");
  const result = await f.handler(f.request("connect"));
  assert.equal(result.state, "connected");
  assert.equal(result.qrCode, null);
});
test("sem provedor configurado status informa pendência e conectar falha", async () => {
  const f = fixture();
  f.provider.configured = () => false;
  assert.equal((await f.handler(f.request())).configured, false);
  await assert.rejects(() => f.handler(f.request("connect")), {
    code: "failed-precondition",
  });
  assert.equal(f.calls.length, 0);
  assert.equal(f.data.get("tenantWhatsAppIntegrations/owner").lockUntil, 0);
});
test("desconectar afeta somente a instância da loja e limpa o QR", async () => {
  const f = fixture();
  const r = await f.handler(f.request("disconnect"));
  assert.equal(r.state, "disconnected");
  assert.equal(r.qrCode, null);
  assert.deepEqual(f.calls, [["disconnect", instanceName("project", "owner")]]);
});
test("operações simultâneas são serializadas e falha não expõe erro do provedor", async () => {
  const f = fixture();
  let release;
  f.provider.connect = async () =>
    new Promise((resolve) => {
      release = () => resolve({ base64: png });
    });
  const pending = f.handler(f.request("connect"));
  while (!release) await new Promise((resolve) => setImmediate(resolve));
  await assert.rejects(() => f.handler(f.request("disconnect")), {
    code: "aborted",
  });
  release();
  await pending;
  f.provider.state = async () => {
    throw Error("API KEY PRIVATE-TOKEN");
  };
  await assert.rejects(
    () => f.handler(f.request("connect")),
    (e) => e.code === "unavailable" && !e.message.includes("PRIVATE-TOKEN"),
  );
  assert.equal(f.data.get("tenantWhatsAppIntegrations/owner").lockUntil, 0);
});
test("limite por loja evita excesso de consultas", async () => {
  const f = fixture();
  for (let i = 0; i < 60; i++) await f.handler(f.request());
  await assert.rejects(() => f.handler(f.request()), {
    code: "resource-exhausted",
  });
  f.advance();
  await f.handler(f.request());
});
test("adapter exige HTTPS e usa somente endpoints com apikey no servidor", async () => {
  const requests = [];
  const provider = createEvolution({
    baseUrl: () => "https://evolution.example",
    apiKey: () => "private-key",
    fetchImpl: async (url, options) => {
      requests.push({ url, ...options });
      return new Response(JSON.stringify({ instance: { state: "open" } }));
    },
  });
  assert.equal(await provider.state("tenant one"), "open");
  await provider.create("tenant-one");
  assert.equal(
    requests[0].url,
    "https://evolution.example/instance/connectionState/tenant%20one",
  );
  assert.equal(requests[0].headers.apikey, "private-key");
  assert.equal(requests[0].redirect, "error");
  assert.equal(JSON.parse(requests[1].body).integration, "WHATSAPP-BAILEYS");
  assert.equal(
    createEvolution({
      baseUrl: () => "http://host",
      apiKey: () => "key",
    }).configured(),
    false,
  );
  assert.equal(
    createEvolution({
      baseUrl: () => "https://user:pass@host",
      apiKey: () => "key",
    }).configured(),
    false,
  );
});
test("adapter trata 404, respostas de erro 200 e estado inesperado", async () => {
  const make = (response) =>
    createEvolution({
      baseUrl: () => "https://evolution.example",
      apiKey: () => "key",
      fetchImpl: async () => response.clone(),
    });
  assert.equal(
    await make(new Response("{}", { status: 404 })).state("test"),
    "missing",
  );
  await assert.rejects(() =>
    make(new Response('{"error":true,"message":"private"}')).connect("test"),
  );
  await assert.rejects(() =>
    make(new Response('{"instance":{"state":"weird"}}')).state("test"),
  );
  await make(new Response("{}", { status: 404 })).disconnect("test");
});
