const assert = require("node:assert/strict");
const {
  createWhatsAppMessages,
  defaults,
  webhookToken,
} = require("../../firebase/employee-access/whatsapp-messages.cjs");
const { instanceName } = require("../../firebase/employee-access/whatsapp.cjs");
class HttpsError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}
function fixture() {
  let clock = 1700000000000,
    connection = "open";
  const data = new Map([
    [
      "tenants/owner",
      { ownerUid: "owner", status: "active", name: "Loja & Café" },
    ],
    [
      "tenants/other",
      { ownerUid: "other", status: "active", name: "Outra loja" },
    ],
    [
      "tenants/owner/orders/order-1",
      {
        source: "web",
        storeId: "owner",
        customer: "Ana",
        phone: "11987654321",
        status: "new",
        fulfillment: "delivery",
      },
    ],
  ]);
  const snap = (path, records = data) => ({
    id: path.split("/").at(-1),
    exists: records.has(path),
    data: () => records.get(path),
  });
  const apply = (records, path, value, options) =>
    records.set(
      path,
      options?.merge ? { ...records.get(path), ...value } : value,
    );
  const db = {
    doc: (path) => ({
      path,
      get: async () => snap(path),
      set: async (value, options) => apply(data, path, value, options),
    }),
    collection: (path) => {
      let count = 10,
        cursor = null;
      const fields = [],
        filters = [];
      const query = {
        orderBy: (field, direction = "asc") => {
          fields.push([field, direction]);
          return query;
        },
        where: (field, operator, value) => {
          assert.equal(operator, "==");
          filters.push([field, value]);
          return query;
        },
        startAfter: (snapshot) => {
          cursor = snapshot.id;
          return query;
        },
        limit: (n) => {
          count = n;
          return query;
        },
        get: async () => {
          let keys = [...data.keys()].filter(
            (k) =>
              k.startsWith(path + "/") &&
              !k.slice(path.length + 1).includes("/") &&
              filters.every(([field, value]) => data.get(k)[field] === value) &&
              fields.every(([field]) => data.get(k)[field] !== undefined),
          );
          keys.sort((a, b) => {
            for (const [field, direction] of fields) {
              const convert = (v) => (v instanceof Date ? v.getTime() : v);
              const av = convert(data.get(a)[field]) ?? 0,
                bv = convert(data.get(b)[field]) ?? 0;
              if (av !== bv)
                return (av < bv ? -1 : 1) * (direction === "desc" ? -1 : 1);
            }
            return (
              a.localeCompare(b) * (fields.at(-1)?.[1] === "desc" ? -1 : 1)
            );
          });
          if (cursor) {
            const index = keys.findIndex((k) => k.split("/").at(-1) === cursor);
            keys = keys.slice(index + 1);
          }
          return { docs: keys.slice(0, count).map((k) => snap(k)) };
        },
      };
      return query;
    },
  };
  let chain = Promise.resolve();
  db.runTransaction = (fn) => {
    const task = chain.then(async () => {
      const staged = new Map(data);
      let writing = false;
      const written = new Set();
      const result = await fn({
        get: async (ref) => {
          assert.equal(writing, false, "reads before writes");
          return snap(ref.path, staged);
        },
        set: (ref, value, options) => {
          writing = true;
          written.add(ref.path);
          apply(staged, ref.path, value, options);
        },
        create: (ref, value) => {
          writing = true;
          written.add(ref.path);
          assert.equal(staged.has(ref.path), false);
          staged.set(ref.path, value);
        },
      });
      for (const path of written) data.set(path, staged.get(path));
      return result;
    });
    chain = task.catch(() => {});
    return task;
  };
  const sent = [],
    webhooks = [];
  const provider = {
    configured: () => true,
    state: async () => connection,
    sendText: async (...args) => {
      sent.push(args);
      return { key: { id: `provider-${sent.length}` } };
    },
    setWebhook: async (...args) => {
      webhooks.push(args);
      return {};
    },
  };
  const api = createWhatsAppMessages({
    db,
    HttpsError,
    provider,
    projectId: "project",
    timestamp: () => new Date(clock),
    now: () => clock,
    webhookSecret: () => "private-webhook-secret",
    webhookUrl: () => "https://functions.example/webhook",
  });
  const request = (action, extra = {}) => ({
    auth: { uid: "owner" },
    data: { storeId: "owner", action, ...extra },
  });
  const jobs = () =>
    [...data].filter(([path]) =>
      path.startsWith("tenantWhatsAppIntegrations/owner/whatsappMessages/"),
    );
  const event = ([path]) => ({
    params: { storeId: "owner", messageId: path.split("/").at(-1) },
  });
  const orderEvent = (before, after) => ({
    params: { storeId: "owner", orderId: "order-1" },
    time: new Date(clock).toISOString(),
    data: {
      before: { data: () => before },
      after: { exists: true, data: () => after },
    },
  });
  const inbound = (text = "Oi", changes = {}) => ({
    storeId: "owner",
    authorization:
      "Bearer " + webhookToken("private-webhook-secret", "project", "owner"),
    body: {
      event: "messages.upsert",
      instance: instanceName("project", "owner"),
      data: {
        key: { fromMe: false, remoteJid: "5511987654321@s.whatsapp.net" },
        messageTimestamp: clock / 1000,
        message: { conversation: text },
        ...changes,
      },
    },
  });
  const settings = (extra = {}) => {
    data.set("tenantWhatsAppSettings/owner", {
      ...structuredClone(defaults),
      ...extra,
    });
  };
  return {
    data,
    api,
    provider,
    sent,
    webhooks,
    request,
    jobs,
    event,
    orderEvent,
    inbound,
    settings,
    advance: (ms) => {
      clock += ms;
    },
    disconnect: () => {
      connection = "close";
    },
  };
}
module.exports = { fixture };
