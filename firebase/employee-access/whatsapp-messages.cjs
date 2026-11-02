const { createHash, createHmac, timingSafeEqual } = require("node:crypto");
const { instanceName } = require("./whatsapp.cjs");
const hash = (v) => createHash("sha256").update(v).digest("hex");
const states = ["new", "preparing", "delivery", "done", "cancelled"];
const labels = {
  new: "recebido",
  preparing: "em preparo",
  delivery: "saiu para entrega",
  done: "concluído",
  cancelled: "cancelado",
};
const defaults = {
  revision: 0,
  orderEnabled: false,
  welcomeEnabled: false,
  welcomeText: "Olá! Seja bem-vindo(a) ao {loja}. Como podemos ajudar?",
  orderTexts: {
    new: "Olá, {cliente}! Recebemos seu pedido {pedido} no {loja}.",
    preparing: "Olá, {cliente}! Seu pedido {pedido} no {loja} está em preparo.",
    delivery: "Olá, {cliente}! Seu pedido {pedido} no {loja} está {status}.",
    done: "Olá, {cliente}! Seu pedido {pedido} no {loja} foi concluído. Obrigado!",
    cancelled:
      "Olá, {cliente}. Seu pedido {pedido} no {loja} foi cancelado. Fale com a loja para mais informações.",
  },
  quickReplies: [
    {
      id: "saudacao",
      title: "Saudação",
      text: "Olá, {cliente}! Aqui é do {loja}. Como podemos ajudar?",
    },
    {
      id: "preparo",
      title: "Pedido em preparo",
      text: "Olá, {cliente}! Estamos preparando seu pedido {pedido}.",
    },
  ],
};
const validId = (v) => typeof v === "string" && /^[\w-]{1,128}$/.test(v);
function phone(value) {
  if (typeof value !== "string") return null;
  let p = value.replace(/\D/g, "");
  if (/^\d{10,11}$/.test(p)) p = "55" + p;
  return /^55[1-9]\d{9,10}$/.test(p) ? p : null;
}
function config(value) {
  return {
    ...defaults,
    ...value,
    orderTexts: { ...defaults.orderTexts, ...value?.orderTexts },
    quickReplies: value?.quickReplies || defaults.quickReplies,
  };
}
function validateConfig(value) {
  if (
    !value ||
    typeof value.orderEnabled !== "boolean" ||
    typeof value.welcomeEnabled !== "boolean" ||
    !Array.isArray(value.quickReplies) ||
    value.quickReplies.length > 10
  )
    throw Error("config");
  const text = (v) => {
    if (
      typeof v !== "string" ||
      !v.trim() ||
      v.length > 1000 ||
      /\{(?!cliente\}|loja\}|pedido\}|status\})/.test(v)
    )
      throw Error("text");
    return v.trim();
  };
  const quickReplies = value.quickReplies.map((item) => {
    if (
      !validId(item.id) ||
      typeof item.title !== "string" ||
      !item.title.trim() ||
      item.title.length > 60
    )
      throw Error("reply");
    return { id: item.id, title: item.title.trim(), text: text(item.text) };
  });
  if (new Set(quickReplies.map((x) => x.id)).size !== quickReplies.length)
    throw Error("duplicate");
  return {
    orderEnabled: value.orderEnabled,
    welcomeEnabled: value.welcomeEnabled,
    welcomeText: text(value.welcomeText),
    orderTexts: Object.fromEntries(
      states.map((s) => [s, text(value.orderTexts?.[s])]),
    ),
    quickReplies,
  };
}
function render(template, store, order = {}) {
  return template
    .replace(
      /\{(cliente|loja|pedido|status)\}/g,
      (_, key) =>
        ({
          cliente: order.customer || "cliente",
          loja: store.name || "restaurante",
          pedido: order.id || "",
          status:
            order.status === "delivery" && order.fulfillment === "pickup"
              ? "pronto para retirada"
              : labels[order.status] || "",
        })[key],
    )
    .slice(0, 2000);
}
function webhookToken(secret, projectId, storeId) {
  return createHmac("sha256", secret)
    .update(`${projectId}:${storeId}`)
    .digest("hex");
}
const millis = (value) =>
  value?.toMillis?.() || (value instanceof Date ? value.getTime() : 0);
function createWhatsAppMessages({
  db,
  HttpsError,
  provider,
  projectId,
  timestamp,
  webhookSecret = () => "",
  webhookUrl = () => "",
  now = Date.now,
}) {
  const fail = (code, message) => {
    throw new HttpsError(code, message);
  };
  const root = (id) => `tenantWhatsAppIntegrations/${id}`;
  const settingsRef = (id) => db.doc(`tenantWhatsAppSettings/${id}`);
  async function owner(request) {
    const id = request.data?.storeId;
    if (!request.auth)
      fail("unauthenticated", "Entre com a conta do proprietário.");
    if (typeof id !== "string" || !id || id.length > 128 || id.includes("/"))
      fail("invalid-argument", "Loja inválida.");
    if (request.auth.uid !== id) fail("permission-denied", "Acesso negado.");
    const store = (await db.doc(`tenants/${id}`).get()).data();
    if (
      !store ||
      store.ownerUid !== id ||
      !["configured", "active"].includes(store.status)
    )
      fail("permission-denied", "Loja indisponível.");
    return { id, store };
  }
  async function enqueue(storeId, id, data) {
    const ref = db.doc(`${root(storeId)}/whatsappMessages/${id}`);
    await db.runTransaction(async (tx) => {
      const old = await tx.get(ref);
      if (!old.exists)
        tx.create(ref, {
          ...data,
          status: "queued",
          createdAt: timestamp(),
          deadlineAt: now() + 900000,
          expiresAt: new Date(now() + 2592000000),
        });
    });
    return { id };
  }
  async function history(id) {
    const result = await db
      .collection(`${root(id)}/whatsappMessages`)
      .orderBy("createdAt", "desc")
      .limit(10)
      .get();
    return result.docs.map((d) => {
      const v = d.data();
      return {
        id: d.id,
        kind: v.kind,
        customer: v.customer || "Cliente",
        text: v.text,
        status:
          v.status === "sending" && v.attemptedAt < now() - 90000
            ? "unconfirmed"
            : v.status,
        createdAt: millis(v.createdAt),
      };
    });
  }
  async function registerWebhook(storeId) {
    const secret = webhookSecret();
    let url;
    try {
      url = new URL(webhookUrl());
      if (url.protocol !== "https:" || url.username || url.password)
        throw Error();
    } catch {
      fail(
        "failed-precondition",
        "O suporte precisa configurar o recebimento de mensagens.",
      );
    }
    if (!secret)
      fail(
        "failed-precondition",
        "O suporte precisa configurar o recebimento de mensagens.",
      );
    url.searchParams.set("storeId", storeId);
    await provider.setWebhook(
      instanceName(projectId, storeId),
      url.href,
      webhookToken(secret, projectId, storeId),
    );
  }
  async function restoreWebhook(storeId) {
    const settings = config((await settingsRef(storeId).get()).data());
    if (settings.welcomeEnabled || settings.orderEnabled)
      await registerWebhook(storeId);
  }
  async function handler(request) {
    const { id, store } = await owner(request);
    const input = request.data;
    const action = input.action;
    if (action === "get")
      return {
        settings: config((await settingsRef(id).get()).data()),
        history: await history(id),
      };
    if (action === "history") return { history: await history(id) };
    if (action === "save") {
      let next;
      try {
        next = validateConfig(input.settings);
      } catch {
        fail(
          "invalid-argument",
          "Confira os textos e as respostas rápidas. Use apenas {cliente}, {loja}, {pedido} e {status}.",
        );
      }
      if (!Number.isSafeInteger(input.revision) || input.revision < 0)
        fail("invalid-argument", "Atualize as configurações antes de salvar.");
      const lockRef = db.doc(root(id));
      const lockToken = hash(`${id}:${now()}:${Math.random()}`);
      await db.runTransaction(async (tx) => {
        const [s, l] = await Promise.all([
          tx.get(settingsRef(id)),
          tx.get(lockRef),
        ]);
        if ((s.data()?.revision || 0) !== input.revision)
          fail(
            "aborted",
            "As configurações mudaram. Reabra o painel para atualizar.",
          );
        if (l.data()?.lockUntil > now())
          fail("aborted", "Aguarde a alteração em andamento.");
        tx.set(
          lockRef,
          { lockToken, lockUntil: now() + 45000 },
          { merge: true },
        );
      });
      try {
        if (next.orderEnabled || next.welcomeEnabled) {
          if (
            !provider.configured() ||
            (await provider.state(instanceName(projectId, id))) !== "open"
          )
            fail(
              "failed-precondition",
              "Conecte o WhatsApp antes de ativar os envios.",
            );
        }
        if (next.welcomeEnabled || next.orderEnabled) await registerWebhook(id);
        const saved = {
          ...next,
          revision: input.revision + 1,
          updatedAt: timestamp(),
        };
        await db.runTransaction(async (tx) => {
          const [s, l] = await Promise.all([
            tx.get(settingsRef(id)),
            tx.get(lockRef),
          ]);
          if (
            l.data()?.lockToken !== lockToken ||
            (s.data()?.revision || 0) !== input.revision
          )
            fail("aborted", "As configurações mudaram. Reabra o painel.");
          tx.set(settingsRef(id), saved);
        });
        return { settings: saved };
      } catch (error) {
        if (error instanceof HttpsError) throw error;
        fail(
          "unavailable",
          "Não foi possível configurar a Evolution API. Tente novamente.",
        );
      } finally {
        await db.runTransaction(async (tx) => {
          if ((await tx.get(lockRef)).data()?.lockToken === lockToken)
            tx.set(lockRef, { lockUntil: 0, lockToken: null }, { merge: true });
        });
      }
    }
    if (action === "sendReply") {
      if (
        !validId(input.orderId) ||
        !validId(input.replyId) ||
        typeof input.requestId !== "string" ||
        !/^[\w-]{16,100}$/.test(input.requestId)
      )
        fail("invalid-argument", "Selecione o pedido e a resposta rápida.");
      const [s, o] = await Promise.all([
        settingsRef(id).get(),
        db.doc(`tenants/${id}/orders/${input.orderId}`).get(),
      ]);
      const settings = config(s.data()),
        order = o.data(),
        reply = settings.quickReplies.find((r) => r.id === input.replyId);
      if (input.revision !== settings.revision)
        fail(
          "aborted",
          "As respostas mudaram. Reabra o painel antes de enviar.",
        );
      if (!order || order.source !== "web" || !phone(order.phone) || !reply)
        fail(
          "failed-precondition",
          "O pedido não possui um WhatsApp válido ou a resposta não existe.",
        );
      try {
        await registerWebhook(id);
      } catch (error) {
        if (error instanceof HttpsError) throw error;
        fail(
          "unavailable",
          "Não foi possível preparar a conexão de mensagens. Tente novamente.",
        );
      }
      const result = await enqueue(id, `reply-${hash(input.requestId)}`, {
        kind: "reply",
        orderId: input.orderId,
        phone: phone(order.phone),
        customer: order.customer || "Cliente",
        text: render(reply.text, store, { ...order, id: input.orderId }),
      });
      return { queued: true, ...result };
    }
    fail("invalid-argument", "Ação inválida.");
  }
  async function orderChanged(event) {
    const after = event.data?.after;
    if (!after?.exists) return;
    const previous = event.data.before?.data();
    const value = after.data();
    if (
      value.source !== "web" ||
      !states.includes(value.status) ||
      value.status === previous?.status ||
      !phone(value.phone)
    )
      return;
    if (event.time && Date.parse(event.time) < now() - 900000) return;
    const { storeId, orderId } = event.params;
    const [s, st, o] = await Promise.all([
      settingsRef(storeId).get(),
      db.doc(`tenants/${storeId}`).get(),
      db.doc(`tenants/${storeId}/orders/${orderId}`).get(),
    ]);
    const settings = config(s.data()),
      store = st.data(),
      order = o.data();
    if (
      !settings.orderEnabled ||
      !store ||
      store.ownerUid !== storeId ||
      !["configured", "active"].includes(store.status) ||
      !phone(order?.phone) ||
      order?.status !== value.status
    )
      return;
    await enqueue(storeId, `order-${hash(`${orderId}:${value.status}`)}`, {
      kind: "order",
      orderId,
      orderStatus: value.status,
      phone: phone(order.phone),
      customer: order.customer || "Cliente",
      text: render(settings.orderTexts[value.status], store, {
        ...order,
        id: orderId,
      }),
    });
  }
  async function inbound({ storeId, authorization, body }) {
    if (
      typeof storeId !== "string" ||
      !storeId ||
      storeId.length > 128 ||
      storeId.includes("/")
    )
      return false;
    const secret = webhookSecret();
    if (!secret) return false;
    const expected = `Bearer ${webhookToken(secret, projectId, storeId)}`;
    const received = typeof authorization === "string" ? authorization : "";
    if (
      Buffer.byteLength(expected) !== Buffer.byteLength(received) ||
      !timingSafeEqual(Buffer.from(expected), Buffer.from(received))
    )
      return false;
    if (body?.instance !== instanceName(projectId, storeId)) return false;
    if (!["messages.upsert", "MESSAGES_UPSERT"].includes(body.event))
      return true;
    const batch = Array.isArray(body.data) ? body.data : [body.data];
    if (batch.length > 25) return true;
    const [s, st] = await Promise.all([
      settingsRef(storeId).get(),
      db.doc(`tenants/${storeId}`).get(),
    ]);
    const settings = config(s.data()),
      store = st.data();
    if (
      !store ||
      store.ownerUid !== storeId ||
      !["configured", "active"].includes(store.status)
    )
      return true;
    for (const message of batch) {
      if (!message?.key || message.key.fromMe !== false) continue;
      if (
        typeof message.key.remoteJid === "string" &&
        /@(g\.us|broadcast)$/.test(message.key.remoteJid)
      )
        continue;
      const jid = [message.key.remoteJid, message.key.remoteJidAlt].find(
        (v) => typeof v === "string" && /^\d+@s\.whatsapp\.net$/.test(v),
      );
      const number = phone(jid?.split("@")[0]);
      const age = Number(message.messageTimestamp) * 1000;
      if (
        !number ||
        !Number.isFinite(age) ||
        age < now() - 600000 ||
        age > now() + 60000
      )
        continue;
      const raw =
        message.message?.conversation ||
        message.message?.extendedTextMessage?.text;
      const text = typeof raw === "string" ? raw.trim().slice(0, 4000) : "";
      if (!text) continue;
      const command = text.toUpperCase();
      const contactRef = db.doc(`${root(storeId)}/contacts/${hash(number)}`);
      if (["SAIR", "PARAR", "VOLTAR"].includes(command)) {
        await db.runTransaction(async (tx) => {
          await tx.get(contactRef);
          tx.set(
            contactRef,
            { optedOut: command !== "VOLTAR", updatedAt: timestamp() },
            { merge: true },
          );
        });
        continue;
      }
      if (!settings.welcomeEnabled || (await contactRef.get()).data()?.optedOut)
        continue;
      await enqueue(
        storeId,
        `welcome-${hash(`${number}:${Math.floor(now() / 86400000)}`)}`,
        {
          kind: "welcome",
          phone: number,
          customer: "Cliente",
          text: render(settings.welcomeText, store),
        },
      );
    }
    return true;
  }
  async function messageCreated(event) {
    const { storeId, messageId } = event.params;
    const ref = db.doc(`${root(storeId)}/whatsappMessages/${messageId}`);
    const existing = (await ref.get()).data();
    if (
      !existing ||
      existing.attemptedAt ||
      ["sent", "failed", "skipped", "unconfirmed"].includes(existing.status)
    )
      return;
    if (existing.deadlineAt < now()) {
      await ref.set({ status: "skipped", reason: "expired" }, { merge: true });
      return;
    }
    if (
      !provider.configured() ||
      (await provider.state(instanceName(projectId, storeId))) !== "open"
    )
      throw Error("whatsapp-not-connected");
    let payload = null;
    await db.runTransaction(async (tx) => {
      const [j, s, st, c, l, o] = await Promise.all([
        tx.get(ref),
        tx.get(settingsRef(storeId)),
        tx.get(db.doc(`tenants/${storeId}`)),
        tx.get(db.doc(`${root(storeId)}/contacts/${hash(existing.phone)}`)),
        tx.get(db.doc(`${root(storeId)}/limits/current`)),
        existing.orderId
          ? tx.get(db.doc(`tenants/${storeId}/orders/${existing.orderId}`))
          : Promise.resolve(null),
      ]);
      const job = j.data(),
        settings = config(s.data()),
        store = st.data(),
        contact = c.data(),
        limit = l.data() || {};
      if (
        !job ||
        job.attemptedAt ||
        ["sent", "failed", "skipped", "unconfirmed"].includes(job.status)
      )
        return;
      if (
        !store ||
        store.ownerUid !== storeId ||
        !["configured", "active"].includes(store.status) ||
        contact?.optedOut ||
        (job.kind === "welcome" && contact?.lastWelcomeAt > now() - 86400000) ||
        job.deadlineAt < now() ||
        (job.kind === "welcome" && !settings.welcomeEnabled) ||
        (job.kind === "order" &&
          (!settings.orderEnabled || o?.data()?.status !== job.orderStatus))
      ) {
        tx.set(
          ref,
          { status: "skipped", reason: "not-eligible" },
          { merge: true },
        );
        return;
      }
      const minute = Math.floor(now() / 60000),
        day = Math.floor(now() / 86400000),
        count = limit.minute === minute ? limit.count || 0 : 0,
        daily = limit.day === day ? limit.daily || 0 : 0;
      if (count >= 30 || daily >= 1000) throw Error("whatsapp-rate-limit");
      tx.set(db.doc(`${root(storeId)}/limits/current`), {
        minute,
        count: count + 1,
        day,
        daily: daily + 1,
      });
      if (job.kind === "welcome")
        tx.set(
          db.doc(`${root(storeId)}/contacts/${hash(job.phone)}`),
          { lastWelcomeAt: now() },
          { merge: true },
        );
      tx.set(ref, { status: "sending", attemptedAt: now() }, { merge: true });
      payload = job;
    });
    if (!payload) return;
    try {
      const response = await provider.sendText(
        instanceName(projectId, storeId),
        payload.phone,
        payload.text,
      );
      const id = response?.key?.id;
      if (typeof id !== "string" || !id || id.length > 200)
        throw Error("invalid-provider-ack");
      await ref.set(
        { status: "sent", providerMessageId: id, sentAt: timestamp() },
        { merge: true },
      );
    } catch (error) {
      await ref.set(
        {
          status:
            error.status >= 400 && error.status < 500
              ? "failed"
              : "unconfirmed",
          updatedAt: timestamp(),
        },
        { merge: true },
      );
    }
  }
  return {
    handler,
    orderChanged,
    inbound,
    messageCreated,
    restoreWebhook,
  };
}
module.exports = {
  createWhatsAppMessages,
  defaults,
  validateConfig,
  phone,
  render,
  webhookToken,
};
