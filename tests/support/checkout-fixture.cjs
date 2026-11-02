const assert = require("node:assert/strict");
const {
  createCheckout,
} = require("../../firebase/employee-access/checkout.cjs");
const {
  createCheckoutPix,
} = require("../../firebase/employee-access/checkout-pix.cjs");
class HttpsError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}
function fixture() {
  const data = new Map([
    ["tenantDomains/loja-teste", { tenantId: "store" }],
    [
      "tenants/store",
      {
        ownerUid: "store",
        slug: "loja-teste",
        status: "active",
        receivingOrders: true,
        acceptsDelivery: true,
        acceptsPickup: true,
        deliveryFeeCents: 590,
        asaasWalletId: "wallet-valid-123",
      },
    ],
    ["tenants/store/categories/food", { storeId: "store" }],
    [
      "tenants/store/products/burger",
      {
        storeId: "store",
        available: true,
        categoryId: "food",
        name: "Burger",
        priceCents: 2500,
        customization: {
          groups: [
            {
              name: "Adicionais",
              min: 0,
              max: 2,
              repeat: true,
              options: [{ name: "Queijo", priceCents: 300 }],
            },
          ],
          division: null,
        },
      },
    ],
  ]);
  const snap = (path, records = data) => ({
    exists: records.has(path),
    data: () => records.get(path),
  });
  const db = { doc: (path) => ({ path, get: async () => snap(path) }) };
  let queue = Promise.resolve();
  db.runTransaction = (action) => {
    const result = queue.then(async () => {
      const staged = new Map(data);
      let writing = false;
      const tx = {
        get: async (ref) => {
          assert.equal(writing, false, "reads must precede writes");
          return snap(ref.path, staged);
        },
        set: (ref, value) => {
          writing = true;
          staged.set(ref.path, value);
        },
        create: (ref, value) => {
          writing = true;
          assert.equal(staged.has(ref.path), false, "duplicate create");
          staged.set(ref.path, value);
        },
        update: (ref, values) => {
          writing = true;
          assert.ok(staged.has(ref.path), "update missing document");
          staged.set(ref.path, { ...staged.get(ref.path), ...values });
        },
      };
      const answer = await action(tx);
      data.clear();
      for (const [key, value] of staged) data.set(key, value);
      return answer;
    });
    queue = result.catch(() => {});
    return result;
  };
  const checkout = createCheckout({
    db,
    HttpsError,
    timestamp: () => 123,
    now: () => 1000000,
    pixEnabled: () => true,
  });
  const input = {
    slug: "loja-teste",
    requestId: "random-request-id-123456789",
    fulfillment: "delivery",
    payment: "cash",
    customer: {
      name: "Cliente Teste",
      phone: "11999990000",
      address: "Rua de teste, 10",
      cpf: "52998224725",
    },
    items: [
      {
        productId: "burger",
        quantity: 2,
        groups: [{ groupIndex: 0, options: [{ optionIndex: 0, quantity: 1 }] }],
        parts: [],
      },
    ],
    notes: "Sem cebola",
  };
  const call = async (action, values = {}) =>
    checkout.handler({
      data: { ...input, ...values, action },
      rawRequest: { ip: "127.0.0.1" },
    });
  return { data, db, checkout, input, call };
}
async function prepare(f, values = {}) {
  const quote = await f.call("quote", values);
  return { ...values, pricingHash: quote.pricingHash };
}
function pixFixture(f) {
  let created = 0,
    timeout = false;
  let payment = null;
  const provider = {
    environment: "sandbox",
    customer: async () => "cus_test",
    createPayment: async (session, customer) => {
      created++;
      payment = {
        id: "pay_test",
        customer,
        externalReference: session.id,
        value: session.totalCents / 100,
        billingType: "PIX",
        status: "PENDING",
      };
      if (timeout) throw Error("timeout");
      return payment;
    },
    findPayment: async () => payment,
    getPayment: async () => ({ ...payment }),
    qrCode: async () => ({
      encodedImage: "png",
      payload: "pix-code",
      expirationDate: "2026-11-01",
    }),
  };
  const service = createCheckoutPix({
    db: f.db,
    checkout: f.checkout,
    provider,
    HttpsError,
    timestamp: () => 456,
    now: () => 1000000,
    uuid: () => "lease-token",
  });
  return {
    service,
    provider,
    get created() {
      return created;
    },
    setTimeout: () => (timeout = true),
    setPayment: (values) => (payment = { ...payment, ...values }),
  };
}

module.exports = { fixture, pixFixture, prepare, HttpsError };
