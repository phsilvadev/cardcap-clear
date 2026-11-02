const test = require("node:test");
const assert = require("node:assert/strict");
const { createCheckout } = require("./checkout.cjs");
const { createCheckoutPix, validWebhookToken } = require("./checkout-pix.cjs");
const { priceLine } = require("./product-price.cjs");
const { createAsaas } = require("./asaas.cjs");
const {
  fixture,
  pixFixture,
  prepare,
  HttpsError,
} = require("../../tests/support/checkout-fixture.cjs");
test("calcula itens, adicionais e frete no servidor e cria pedido presencial como a pagar", async () => {
  const f = fixture();
  const quote = await f.call("quote");
  assert.equal(quote.totalCents, 6190);
  const receipt = await f.call("create", {
    pricingHash: quote.pricingHash,
    total: 1,
    paymentStatus: "paid",
  });
  const order = f.data.get(`tenants/store/orders/${receipt.id}`);
  assert.equal(order.total, 6190);
  assert.equal(order.paymentStatus, "due_on_fulfillment");
  assert.equal(order.status, "new");
  assert.equal("customer" in receipt, false);
});
test("reenvio concorrente do mesmo pedido cria somente um pedido", async () => {
  const f = fixture(),
    options = await prepare(f);
  const [one, two] = await Promise.all([
    f.call("create", options),
    f.call("create", options),
  ]);
  assert.equal(one.id, two.id);
  assert.equal(
    [...f.data.keys()].filter((path) => path.includes("/orders/")).length,
    1,
  );
  await assert.rejects(
    f.call("create", { ...options, notes: "outro pedido" }),
    { code: "already-exists" },
  );
});
test("preço alterado exige nova confirmação, produto de outra loja e opção inventada são bloqueados", async () => {
  const f = fixture(),
    options = await prepare(f);
  f.data.get("tenants/store/products/burger").priceCents = 3000;
  await assert.rejects(f.call("create", options), {
    code: "failed-precondition",
  });
  f.data.get("tenants/store/products/burger").storeId = "other";
  await assert.rejects(f.call("quote"), { code: "failed-precondition" });
  f.data.get("tenants/store/products/burger").storeId = "store";
  await assert.rejects(
    f.call("quote", {
      items: [
        {
          productId: "burger",
          quantity: 1,
          groups: [
            { groupIndex: 0, options: [{ optionIndex: 99, quantity: 1 }] },
          ],
        },
      ],
    }),
    { code: "invalid-argument" },
  );
});
test("loja pausada, suspensa, modalidade proibida, frete inválido e CPF inválido não criam pedido", async () => {
  for (const patch of [
    { receivingOrders: false },
    { status: "suspended" },
    { acceptsDelivery: false },
    { deliveryFeeCents: -1 },
  ]) {
    const f = fixture();
    Object.assign(f.data.get("tenants/store"), patch);
    await assert.rejects(f.call("quote"), { code: "failed-precondition" });
  }
  const f = fixture(),
    options = await prepare(f);
  await assert.rejects(
    f.call("create", {
      ...options,
      payment: "pix",
      customer: { ...f.input.customer, cpf: "11111111111" },
    }),
    { code: "invalid-argument" },
  );
});
test("preços de divisão e limites de complementos não vêm do navegador", () => {
  const fail = (code, message) => {
    throw new HttpsError(code, message);
  };
  const product = {
    available: true,
    name: "Pizza",
    priceCents: 3000,
    customization: {
      groups: [],
      division: {
        maxParts: 2,
        pricing: "highest",
        options: [
          { name: "A", priceCents: 3500 },
          { name: "B", priceCents: 4500 },
        ],
      },
    },
  };
  assert.equal(
    priceLine(product, { productId: "pizza", quantity: 1, parts: [0, 1] }, fail)
      .unitCents,
    4500,
  );
  product.customization.division.pricing = "proportional";
  assert.equal(
    priceLine(product, { productId: "pizza", quantity: 1, parts: [0, 1] }, fail)
      .unitCents,
    4000,
  );
  product.customization.division.pricing = "fixed";
  assert.equal(
    priceLine(product, { productId: "pizza", quantity: 1, parts: [0, 1] }, fail)
      .unitCents,
    3000,
  );
  assert.throws(
    () =>
      priceLine(
        product,
        { productId: "pizza", quantity: 1, parts: [0, 0] },
        fail,
      ),
    { code: "invalid-argument" },
  );
});
test("Pix fica fora da cozinha e impressão até confirmação canônica do backend", async () => {
  const f = fixture(),
    options = await prepare(f, { payment: "pix" }),
    receipt = await f.call("create", { ...options, payment: "pix" });
  assert.equal(receipt.orderId, null);
  assert.equal(
    [...f.data.keys()].some((path) => path.includes("/orders/")),
    false,
  );
  const p = pixFixture(f);
  await p.service.handler({ data: f.input });
  await p.service.applyPayment("pay_test");
  assert.equal(
    [...f.data.keys()].some((path) => path.includes("/orders/")),
    false,
  );
  p.setPayment({ status: "RECEIVED" });
  await p.service.applyPayment("pay_test");
  await p.service.applyPayment("pay_test");
  assert.equal(
    f.data.get(`tenants/store/orders/${receipt.id}`).paymentStatus,
    "paid",
  );
  assert.equal(
    [...f.data.keys()].filter((path) => path.includes("/orders/")).length,
    1,
  );
  assert.equal((await f.call("status")).paymentStatus, "paid");
});
test("timeout na cobrança consulta a referência e não cria uma segunda cobrança", async () => {
  const f = fixture();
  await f.call("create", { ...(await prepare(f)), payment: "pix" });
  const p = pixFixture(f);
  p.setTimeout();
  await assert.rejects(p.service.handler({ data: f.input }), {
    code: "unavailable",
  });
  const qr = await p.service.handler({ data: f.input });
  assert.equal(qr.qr.payload, "pix-code");
  assert.equal(p.created, 1);
});
test("um envio incerto sem cobrança localizada permanece incerto em vez de repetir POST", async () => {
  const f = fixture();
  await f.call("create", { ...(await prepare(f)), payment: "pix" });
  const p = pixFixture(f);
  p.setTimeout();
  await assert.rejects(p.service.handler({ data: f.input }));
  p.provider.findPayment = async () => null;
  await assert.rejects(p.service.handler({ data: f.input }), {
    code: "unavailable",
  });
  assert.equal(p.created, 1);
});
test("valor diferente não libera pedido e estorno não volta a pago por evento atrasado", async () => {
  const f = fixture(),
    r = await f.call("create", { ...(await prepare(f)), payment: "pix" }),
    p = pixFixture(f);
  await p.service.handler({ data: f.input });
  p.setPayment({ status: "RECEIVED", value: 1 });
  await assert.rejects(p.service.applyPayment("pay_test"), {
    code: "failed-precondition",
  });
  p.setPayment({ value: r.totalCents / 100 });
  await p.service.applyPayment("pay_test");
  p.setPayment({ status: "REFUNDED" });
  await p.service.applyPayment("pay_test");
  p.setPayment({ status: "RECEIVED" });
  await p.service.applyPayment("pay_test");
  assert.equal((await f.call("status")).paymentStatus, "refunded");
  assert.equal(
    f.data.get(`tenants/store/orders/${r.id}`).paymentReviewRequired,
    true,
  );
});
test("capacidade errada não consulta o pedido e limite de criação é aplicado por intervalo", async () => {
  const f = fixture();
  await assert.rejects(
    f.call("status", { requestId: "other-request-1234567890" }),
    { code: "not-found" },
  );
  const options = await prepare(f);
  for (let i = 0; i < 10; i++)
    await f.call("create", {
      ...options,
      requestId: `unique-request-123456789-${i}`,
    });
  await assert.rejects(
    f.call("create", {
      ...options,
      requestId: "unique-request-123456789-final",
    }),
    { code: "resource-exhausted" },
  );
});
test("token do webhook exige correspondência exata", () => {
  assert.equal(validWebhookToken("short", "short"), false);
  assert.equal(
    validWebhookToken(
      "valid-webhook-token-123456",
      "valid-webhook-token-123456",
    ),
    true,
  );
  assert.equal(
    validWebhookToken(
      "invalid-webhook-token-1234",
      "valid-webhook-token-123456",
    ),
    false,
  );
});
test("adaptador Asaas fixa host, usa segredo só no servidor e split percentual sobre o líquido", async () => {
  const calls = [];
  const api = createAsaas({
    apiKey: "test-only-secret",
    environment: "sandbox",
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return { ok: true, json: async () => ({ id: "pay_example" }) };
    },
  });
  await api.createPayment(
    { id: "web-example", totalCents: 6190, walletId: "wallet-target" },
    "cus_test",
  );
  assert.equal(calls[0].url, "https://api-sandbox.asaas.com/v3/payments");
  const payload = JSON.parse(calls[0].options.body);
  assert.equal(payload.value, 61.9);
  assert.deepEqual(payload.split, [
    { walletId: "wallet-target", percentualValue: 100 },
  ]);
  assert.equal(calls[0].options.headers.access_token, "test-only-secret");
  assert.throws(() =>
    createAsaas({ apiKey: "test", environment: "https://evil.test" }),
  );
});

test("compra, aceite e fila de impressão usam o mesmo total e não imprimem duas vezes", async () => {
  const { createTenantOrders } = require("./tenant-orders.cjs");
  const { createPrintQueue } = require("../../desktop/printing/queue.cjs");
  const { receiptHtml } = require("../../desktop/printing/receipt.cjs");
  const f = fixture();
  f.data.get("tenants/store").name = "Loja de teste";
  f.db.collection = (path) => ({ doc: (id) => f.db.doc(`${path}/${id}`) });
  const receipt = await f.call("create", await prepare(f));
  const orders = createTenantOrders({
    db: f.db,
    HttpsError,
    timestamp: () => 123,
  });
  const request = {
    auth: { uid: "store" },
    data: {
      storeId: "store",
      action: "transition",
      orderId: receipt.id,
      expected: "new",
      target: "preparing",
    },
  };
  await orders.handler(request);
  await orders.handler(request);
  const jobs = [...f.data.entries()].filter(([path]) =>
    path.includes("/printJobs/"),
  );
  assert.equal(jobs.length, 1);
  const [path, job] = jobs[0];
  const payload = {
    id: `${path.split("/").at(-1)}:1`,
    storeId: "store",
    storeName: job.storeName,
    order: job.receipt,
  };
  let printed = 0;
  const queue = createPrintQueue({
    journal: {},
    save: () => {},
    print: async (value) => {
      printed++;
      assert.equal(value.order.total, 6190);
      assert.match(receiptHtml(value), /61,90/);
    },
    confirmRetry: async () => false,
  });
  await Promise.all([queue(payload), queue(payload)]);
  assert.equal(printed, 1);
});

test("só o proprietário confirma pagamento presencial e Pix não pode ser marcado pago manualmente", async () => {
  const { createTenantOrders } = require("./tenant-orders.cjs");
  const f = fixture(),
    receipt = await f.call("create", await prepare(f));
  f.db.collection = (path) => ({ doc: (id) => f.db.doc(`${path}/${id}`) });
  const orders = createTenantOrders({
    db: f.db,
    HttpsError,
    timestamp: () => 123,
  });
  const input = {
    storeId: "store",
    action: "confirmPayment",
    orderId: receipt.id,
    confirmed: true,
  };
  await assert.rejects(
    orders.handler({ auth: { uid: "other" }, data: input }),
    { code: "permission-denied" },
  );
  await assert.rejects(
    orders.handler({
      auth: { uid: "store" },
      data: { ...input, confirmed: false },
    }),
    { code: "invalid-argument" },
  );
  await orders.handler({ auth: { uid: "store" }, data: input });
  await orders.handler({ auth: { uid: "store" }, data: input });
  assert.equal((await f.call("status")).paymentStatus, "paid");
  f.data.get(`tenants/store/orders/${receipt.id}`).payment = "pix";
  await assert.rejects(
    orders.handler({ auth: { uid: "store" }, data: input }),
    { code: "failed-precondition" },
  );
});
