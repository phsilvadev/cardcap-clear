const test = require("node:test");
const assert = require("node:assert/strict");
const {
  defaults,
  validateConfig,
  phone,
  webhookToken,
} = require("./whatsapp-messages.cjs");
const { instanceName } = require("./whatsapp.cjs");
const { fixture } = require("../../tests/support/whatsapp-fixture.cjs");

test("configurações são desativadas por padrão e somente o proprietário pode acessar", async () => {
  const f = fixture();
  const result = await f.api.handler(f.request("get"));
  assert.equal(result.settings.orderEnabled, false);
  assert.equal(result.settings.welcomeEnabled, false);
  assert.deepEqual(result.history, []);
  await assert.rejects(
    () => f.api.handler({ data: { storeId: "owner", action: "get" } }),
    { code: "unauthenticated" },
  );
  await assert.rejects(
    () => f.api.handler(f.request("get", { storeId: "other" })),
    { code: "permission-denied" },
  );
  f.data.set("tenants/owner", { ownerUid: "owner", status: "suspended" });
  await assert.rejects(() => f.api.handler(f.request("get")), {
    code: "permission-denied",
  });
  assert.equal(f.sent.length, 0);
});
test("valida textos, variáveis e respostas rápidas sem aceitar duplicatas ou excesso", () => {
  assert.equal(phone("(11) 98765-4321"), "5511987654321");
  assert.equal(phone("abc"), null);
  for (const value of [
    { ...defaults, welcomeText: "" },
    { ...defaults, welcomeText: "{segredo}" },
    { ...defaults, welcomeText: "x".repeat(1001) },
    {
      ...defaults,
      quickReplies: [defaults.quickReplies[0], defaults.quickReplies[0]],
    },
    { ...defaults, quickReplies: Array(11).fill(defaults.quickReplies[0]) },
  ])
    assert.throws(() => validateConfig(value));
});
test("salva com revisão e registra webhook autenticado por loja sem expor segredo", async () => {
  const f = fixture();
  const result = await f.api.handler(
    f.request("save", {
      settings: { ...defaults, welcomeEnabled: true },
      revision: 0,
    }),
  );
  assert.equal(result.settings.revision, 1);
  assert.equal(f.webhooks.length, 1);
  const [instance, url, token] = f.webhooks[0];
  assert.equal(instance, instanceName("project", "owner"));
  assert.equal(new URL(url).searchParams.get("storeId"), "owner");
  assert.equal(
    token,
    webhookToken("private-webhook-secret", "project", "owner"),
  );
  assert.ok(!JSON.stringify(result).includes("private-webhook-secret"));
  await assert.rejects(
    () => f.api.handler(f.request("save", { settings: defaults, revision: 0 })),
    { code: "aborted" },
  );
});
test("ativar exige conexão e falhas do provedor não deixam configurações parcialmente salvas", async () => {
  const f = fixture();
  f.disconnect();
  await assert.rejects(
    () =>
      f.api.handler(
        f.request("save", {
          settings: { ...defaults, orderEnabled: true },
          revision: 0,
        }),
      ),
    { code: "failed-precondition" },
  );
  assert.equal(f.data.has("tenantWhatsAppSettings/owner"), false);
  assert.equal(f.data.get("tenantWhatsAppIntegrations/owner").lockUntil, 0);
  const g = fixture();
  g.provider.setWebhook = async () => {
    throw Error("private key");
  };
  await assert.rejects(
    () =>
      g.api.handler(
        g.request("save", {
          settings: { ...defaults, welcomeEnabled: true },
          revision: 0,
        }),
      ),
    (e) => e.code === "unavailable" && !e.message.includes("private key"),
  );
  assert.equal(g.data.has("tenantWhatsAppSettings/owner"), false);
});
test("eventos de pedido duplicados criam somente uma mensagem por etapa", async () => {
  const f = fixture();
  f.settings({ orderEnabled: true });
  const order = f.data.get("tenants/owner/orders/order-1");
  const e = f.orderEvent(null, order);
  await Promise.all([f.api.orderChanged(e), f.api.orderChanged(e)]);
  assert.equal(f.jobs().length, 1);
  await Promise.all([
    f.api.messageCreated(f.event(f.jobs()[0])),
    f.api.messageCreated(f.event(f.jobs()[0])),
  ]);
  assert.equal(f.sent.length, 1);
  assert.equal(f.sent[0][0], instanceName("project", "owner"));
  assert.equal(f.sent[0][1], "5511987654321");
  assert.ok(f.sent[0][2].includes("Ana"));
  assert.equal(f.jobs()[0][1].status, "sent");
});
test("eventos antigos e pedidos de salão ou sem telefone não produzem avisos", async () => {
  const f = fixture();
  f.settings({ orderEnabled: true });
  const order = f.data.get("tenants/owner/orders/order-1");
  for (const change of [{ source: "salon" }, { phone: "" }])
    await f.api.orderChanged(f.orderEvent(null, { ...order, ...change }));
  const e = f.orderEvent(null, order);
  e.time = "2000-01-01T00:00:00Z";
  await f.api.orderChanged(e);
  await f.api.orderChanged(f.orderEvent(order, order));
  assert.equal(f.jobs().length, 0);
});
test("etapa ultrapassada e automação desativada cancelam mensagem antes do envio", async () => {
  const f = fixture();
  f.settings({ orderEnabled: true });
  const order = f.data.get("tenants/owner/orders/order-1");
  await f.api.orderChanged(f.orderEvent(null, order));
  f.data.set("tenants/owner/orders/order-1", { ...order, status: "done" });
  await f.api.messageCreated(f.event(f.jobs()[0]));
  assert.equal(f.sent.length, 0);
  assert.equal(f.jobs()[0][1].status, "skipped");
  const g = fixture();
  g.settings({ orderEnabled: true });
  await g.api.orderChanged(
    g.orderEvent(null, g.data.get("tenants/owner/orders/order-1")),
  );
  g.settings({ orderEnabled: false });
  await g.api.messageCreated(g.event(g.jobs()[0]));
  assert.equal(g.sent.length, 0);
});
test("retirada usa texto correto na etapa final de preparo", async () => {
  const f = fixture();
  f.settings({ orderEnabled: true });
  const order = {
    ...f.data.get("tenants/owner/orders/order-1"),
    status: "delivery",
    fulfillment: "pickup",
  };
  f.data.set("tenants/owner/orders/order-1", order);
  await f.api.orderChanged(f.orderEvent({ status: "preparing" }, order));
  assert.ok(f.jobs()[0][1].text.includes("pronto para retirada"));
});
test("timeout é marcado não confirmado e repetição do evento não reenvia", async () => {
  const f = fixture();
  f.settings({ orderEnabled: true });
  await f.api.orderChanged(
    f.orderEvent(null, f.data.get("tenants/owner/orders/order-1")),
  );
  let calls = 0;
  f.provider.sendText = async () => {
    calls++;
    throw Error("timeout");
  };
  const e = f.event(f.jobs()[0]);
  await f.api.messageCreated(e);
  assert.equal(f.jobs()[0][1].status, "unconfirmed");
  await f.api.messageCreated(e);
  assert.equal(calls, 1);
});
test("offline permite retry seguro antes de enviar, mas fila expira em quinze minutos", async () => {
  const f = fixture();
  f.settings({ orderEnabled: true });
  await f.api.orderChanged(
    f.orderEvent(null, f.data.get("tenants/owner/orders/order-1")),
  );
  f.disconnect();
  const e = f.event(f.jobs()[0]);
  await assert.rejects(() => f.api.messageCreated(e));
  assert.equal(f.jobs()[0][1].attemptedAt, undefined);
  f.advance(900001);
  await f.api.messageCreated(e);
  assert.equal(f.jobs()[0][1].status, "skipped");
  assert.equal(f.sent.length, 0);
});
test("webhook rejeita credencial inválida e instância de outra loja", async () => {
  const f = fixture();
  f.settings({ welcomeEnabled: true });
  const req = f.inbound();
  req.authorization = "Bearer fake";
  assert.equal(await f.api.inbound(req), false);
  const other = f.inbound();
  other.body.instance = instanceName("project", "other");
  assert.equal(await f.api.inbound(other), false);
  assert.equal(f.jobs().length, 0);
});
test("boas-vindas ignora mensagens próprias, grupos e histórico antigo", async () => {
  const f = fixture();
  f.settings({ welcomeEnabled: true });
  for (const values of [
    { key: { fromMe: true, remoteJid: "5511987654321@s.whatsapp.net" } },
    { key: { fromMe: false, remoteJid: "123@g.us" } },
    { messageTimestamp: 1 },
  ])
    await f.api.inbound(f.inbound("Oi", values));
  assert.equal(f.jobs().length, 0);
});
test("saudação é deduplicada e respeita intervalo de 24 horas", async () => {
  const f = fixture();
  f.settings({ welcomeEnabled: true });
  await f.api.inbound(f.inbound());
  await f.api.inbound(f.inbound("Olá novamente"));
  assert.equal(f.jobs().length, 1);
  await f.api.messageCreated(f.event(f.jobs()[0]));
  assert.equal(f.sent.length, 1);
  f.advance(3 * 3600000);
  await f.api.inbound(f.inbound());
  for (const j of f.jobs()) await f.api.messageCreated(f.event(j));
  assert.equal(f.sent.length, 1);
  f.advance(25 * 3600000);
  await f.api.inbound(f.inbound());
  for (const j of f.jobs()) await f.api.messageCreated(f.event(j));
  assert.equal(f.sent.length, 2);
});
test("SAIR impede mensagens e VOLTAR permite novos envios solicitados", async () => {
  const f = fixture();
  f.settings();
  await f.api.inbound(f.inbound("SAIR"));
  await f.api.handler(
    f.request("sendReply", {
      orderId: "order-1",
      replyId: "saudacao",
      requestId: "request-1234567890",
      revision: 0,
    }),
  );
  await f.api.messageCreated(f.event(f.jobs()[0]));
  assert.equal(f.sent.length, 0);
  await f.api.inbound(f.inbound("VOLTAR"));
  await f.api.handler(
    f.request("sendReply", {
      orderId: "order-1",
      replyId: "saudacao",
      requestId: "request-2222222222",
      revision: 0,
    }),
  );
  await f.api.messageCreated(f.event(f.jobs().at(-1)));
  assert.equal(f.sent.length, 1);
});
test("resposta rápida usa contato do pedido e requestId impede duplicação", async () => {
  const f = fixture();
  const input = {
    orderId: "order-1",
    replyId: "saudacao",
    requestId: "request-1234567890",
    revision: 0,
    phone: "outro-numero",
  };
  const a = await f.api.handler(f.request("sendReply", input));
  const b = await f.api.handler(f.request("sendReply", input));
  assert.equal(a.id, b.id);
  assert.equal(f.jobs().length, 1);
  assert.equal(f.jobs()[0][1].phone, "5511987654321");
  await assert.rejects(
    () => f.api.handler(f.request("sendReply", { ...input, revision: 4 })),
    { code: "aborted" },
  );
  await assert.rejects(
    () =>
      f.api.handler(
        f.request("sendReply", { ...input, orderId: "other-order" }),
      ),
    { code: "failed-precondition" },
  );
});
test("resposta 4xx não é reenviada e histórico diferencia aceite de envio sem confirmação", async () => {
  const f = fixture();
  await f.api.handler(
    f.request("sendReply", {
      orderId: "order-1",
      replyId: "saudacao",
      requestId: "request-1234567890",
      revision: 0,
    }),
  );
  f.provider.sendText = async () => {
    const e = Error("rejected");
    e.status = 400;
    throw e;
  };
  const e = f.event(f.jobs()[0]);
  await f.api.messageCreated(e);
  await f.api.messageCreated(e);
  assert.equal(f.jobs()[0][1].status, "failed");
  const result = await f.api.handler(f.request("history"));
  assert.equal(result.history[0].status, "failed");
  assert.ok(!JSON.stringify(result).includes("5511987654321"));
});

test("limite por minuto adia sem marcar tentativa e permite envio no minuto seguinte", async () => {
  const f = fixture();
  for (let i = 0; i < 31; i++)
    await f.api.handler(
      f.request("sendReply", {
        orderId: "order-1",
        replyId: "saudacao",
        requestId: `request-number-${String(i).padStart(4, "0")}`,
        revision: 0,
      }),
    );
  const jobs = f.jobs();
  for (const j of jobs.slice(0, 30)) await f.api.messageCreated(f.event(j));
  await assert.rejects(() => f.api.messageCreated(f.event(jobs[30])));
  assert.equal(f.sent.length, 30);
  assert.equal(f.data.get(jobs[30][0]).attemptedAt, undefined);
  f.advance(60001);
  await f.api.messageCreated(f.event(jobs[30]));
  assert.equal(f.sent.length, 31);
});
test("suspender a loja bloqueia mensagens que já estavam na fila", async () => {
  const f = fixture();
  await f.api.handler(
    f.request("sendReply", {
      orderId: "order-1",
      replyId: "saudacao",
      requestId: "request-1234567890",
      revision: 0,
    }),
  );
  f.data.set("tenants/owner", { ownerUid: "owner", status: "suspended" });
  await f.api.messageCreated(f.event(f.jobs()[0]));
  assert.equal(f.sent.length, 0);
  assert.equal(f.jobs()[0][1].status, "skipped");
});

test("recriar a conexão restaura webhook somente com boas-vindas habilitadas", async () => {
  const f = fixture();
  await f.api.restoreWebhook("owner");
  assert.equal(f.webhooks.length, 0);
  f.settings({ welcomeEnabled: true });
  await f.api.restoreWebhook("owner");
  assert.equal(f.webhooks.length, 1);
  assert.equal(f.webhooks[0][0], instanceName("project", "owner"));
});

test("adapter usa os contratos de envio e webhook sem publicar a chave", async () => {
  const { createEvolution } = require("./evolution.cjs");
  const requests = [];
  const provider = createEvolution({
    baseUrl: () => "https://evolution.example",
    apiKey: () => "api-secret",
    fetchImpl: async (url, options) => {
      requests.push({ url, options });
      return new Response(JSON.stringify({ key: { id: "message-id" } }));
    },
  });
  await provider.sendText("tenant-instance", "5511987654321", "Olá");
  await provider.setWebhook(
    "tenant-instance",
    "https://callback.example?storeId=owner",
    "callback-token",
  );
  assert.equal(
    requests[0].url,
    "https://evolution.example/message/sendText/tenant-instance",
  );
  assert.deepEqual(JSON.parse(requests[0].options.body), {
    number: "5511987654321",
    text: "Olá",
    linkPreview: false,
  });
  const webhook = JSON.parse(requests[1].options.body).webhook;
  assert.equal(webhook.headers.Authorization, "Bearer callback-token");
  assert.deepEqual(webhook.events, ["MESSAGES_UPSERT"]);
  assert.equal(webhook.base64, false);
  assert.ok(!requests[1].url.includes("api-secret"));
});
