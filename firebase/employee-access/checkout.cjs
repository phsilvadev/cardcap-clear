const {
  id,
  cents,
  digest,
  priceLine,
  validCpf,
} = require("./checkout-pricing.cjs");
const slugPattern = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;
function createCheckout({
  db,
  HttpsError,
  timestamp,
  now = Date.now,
  pixEnabled = () => false,
}) {
  const fail = (code, message) => {
    throw new HttpsError(code, message);
  };
  const capability = (input) => {
    if (
      !slugPattern.test(input.slug ?? "") ||
      typeof input.requestId !== "string" ||
      !/^[a-zA-Z0-9_-]{20,80}$/.test(input.requestId)
    )
      fail("invalid-argument", "Identificação do pedido inválida.");
    return `web-${digest({ slug: input.slug, requestId: input.requestId }).slice(0, 40)}`;
  };
  const response = (session) => ({
    id: session.id,
    orderId: session.orderId ?? null,
    payment: session.payment,
    paymentStatus: session.paymentStatus,
    totalCents: session.totalCents,
    shippingCents: session.shippingCents,
    lines: session.lines,
    fulfillment: session.fulfillment,
  });
  async function storeFor(tx, slug) {
    if (!slugPattern.test(slug ?? ""))
      fail("invalid-argument", "Loja inválida.");
    const storeId = (await tx.get(db.doc(`tenantDomains/${slug}`))).data()
      ?.tenantId;
    if (!id(storeId)) fail("not-found", "Loja não encontrada.");
    const store = (await tx.get(db.doc(`tenants/${storeId}`))).data();
    if (!store || store.ownerUid !== storeId || store.slug !== slug)
      fail("not-found", "Loja não encontrada.");
    return { storeId, store };
  }
  async function quote(tx, input, context) {
    const { storeId, store } = context;
    if (store.status !== "active" || store.receivingOrders !== true)
      fail("failed-precondition", "A loja não está recebendo pedidos.");
    if (
      !["delivery", "pickup"].includes(input.fulfillment) ||
      (input.fulfillment === "delivery"
        ? store.acceptsDelivery !== true
        : store.acceptsPickup !== true)
    )
      fail(
        "failed-precondition",
        "A loja não oferece essa forma de atendimento.",
      );
    if (
      !Array.isArray(input.items) ||
      !input.items.length ||
      input.items.length > 20 ||
      input.items.some((item) => !id(item?.productId))
    )
      fail("invalid-argument", "Adicione entre 1 e 20 itens válidos.");
    const docs = await Promise.all(
      input.items.map((item) =>
        tx.get(db.doc(`tenants/${storeId}/products/${item.productId}`)),
      ),
    );
    const categories = await Promise.all(
      docs.map((doc) => {
        const data = doc.data();
        if (!data || data.storeId !== storeId || !id(data.categoryId))
          fail(
            "failed-precondition",
            "Um produto não pertence ao cardápio da loja.",
          );
        return tx.get(
          db.doc(`tenants/${storeId}/categories/${data.categoryId}`),
        );
      }),
    );
    if (categories.some((doc) => doc.data()?.storeId !== storeId))
      fail("failed-precondition", "Categoria inválida para esta loja.");
    const lines = docs.map((doc, index) =>
      priceLine(doc.data(), input.items[index], fail),
    );
    if (
      lines
        .map(
          (line) =>
            `${line.quantity} × ${line.name} ${line.details.join(", ")}`,
        )
        .join(" · ").length > 11000
    )
      fail(
        "invalid-argument",
        "O pedido contém muitos detalhes. Divida os itens em dois pedidos.",
      );
    const keys = lines.map((line) =>
      digest({ id: line.productId, groups: line.groups, parts: line.parts }),
    );
    if (new Set(keys).size !== keys.length)
      fail("invalid-argument", "Agrupe os itens repetidos do carrinho.");
    const shippingCents =
      input.fulfillment === "delivery" ? store.deliveryFeeCents : 0;
    if (!cents(shippingCents))
      fail("failed-precondition", "A taxa de entrega não está configurada.");
    const totalCents = lines.reduce(
      (sum, line) => sum + line.totalCents,
      shippingCents,
    );
    if (!cents(totalCents) || totalCents < 1)
      fail("invalid-argument", "Total do pedido inválido.");
    const pricingHash = digest({
      lines,
      shippingCents,
      fulfillment: input.fulfillment,
    });
    return {
      lines,
      shippingCents,
      totalCents,
      pricingHash,
      pixEnabled: pixEnabled(),
    };
  }
  function orderFrom(session) {
    return {
      storeId: session.storeId,
      source: "web",
      customer: session.customer.name,
      phone: session.customer.phone,
      address: session.customer.address,
      fulfillment: session.fulfillment,
      notes: session.notes,
      items: session.lines
        .map(
          (line) =>
            `${line.quantity} × ${line.name}${line.details.length ? ` (${line.details.join(", ")})` : ""}`,
        )
        .join(" · "),
      lines: session.lines,
      total: session.totalCents,
      shippingCents: session.shippingCents,
      status: "new",
      payment: session.payment,
      paymentStatus: session.paymentStatus,
      checkoutId: session.id,
      createdAt: timestamp(),
      createdAtMs: now(),
      updatedAt: timestamp(),
    };
  }
  async function handler(request) {
    const input = request.data ?? {};
    if (!["quote", "create", "status"].includes(input.action))
      fail("invalid-argument", "Operação inválida.");
    return db.runTransaction(async (tx) => {
      const context = await storeFor(tx, input.slug);
      if (input.action === "quote") return quote(tx, input, context);
      const sessionId = capability(input),
        ref = db.doc(
          `tenants/${context.storeId}/checkoutSessions/${sessionId}`,
        );
      const previous = (await tx.get(ref)).data();
      if (input.action === "status") {
        if (!previous)
          fail("not-found", "Pedido não encontrado neste navegador.");
        return response(previous);
      }
      if (!["pix", "card", "cash"].includes(input.payment))
        fail("invalid-argument", "Selecione a forma de pagamento.");
      const customer = input.customer ?? {};
      const name =
        typeof customer.name === "string" ? customer.name.trim() : "";
      const phone =
        typeof customer.phone === "string"
          ? customer.phone.replace(/\D/g, "")
          : "";
      const address =
        typeof customer.address === "string" ? customer.address.trim() : "";
      const cpf =
        typeof customer.cpf === "string" ? customer.cpf.replace(/\D/g, "") : "";
      const notes = typeof input.notes === "string" ? input.notes.trim() : "";
      if (
        name.length < 2 ||
        name.length > 120 ||
        !/^\d{10,11}$/.test(phone) ||
        address.length > 500 ||
        (input.fulfillment === "delivery" && address.length < 5) ||
        notes.length > 500 ||
        (input.payment === "pix" && !validCpf(cpf))
      )
        fail(
          "invalid-argument",
          "Confira nome, telefone, endereço e CPF para Pix.",
        );
      const normalizedCustomer = {
        name,
        phone,
        address: input.fulfillment === "delivery" ? address : "",
        cpf: input.payment === "pix" ? cpf : "",
      };
      const fingerprint = digest({
        items: input.items,
        fulfillment: input.fulfillment,
        payment: input.payment,
        customer: normalizedCustomer,
        notes,
        pricingHash: input.pricingHash,
      });
      if (previous) {
        if (previous.fingerprint !== fingerprint)
          fail(
            "already-exists",
            "Este envio já foi usado com outros dados. Confira seu pedido antes de tentar novamente.",
          );
        return response(previous);
      }
      if (input.payment === "pix" && !pixEnabled())
        fail("failed-precondition", "O Pix online ainda não está habilitado.");
      const pricing = await quote(tx, input, context);
      if (pricing.pricingHash !== input.pricingHash)
        fail(
          "failed-precondition",
          "Os preços ou a entrega mudaram. Atualize o resumo antes de confirmar.",
        );
      if (
        input.payment === "pix" &&
        (typeof context.store.asaasWalletId !== "string" ||
          !/^[a-zA-Z0-9_-]{10,100}$/.test(context.store.asaasWalletId))
      )
        fail(
          "failed-precondition",
          "A loja ainda não configurou o recebimento por Pix.",
        );
      const ip = request.rawRequest?.ip ?? "unknown";
      const rateRef = db.doc(
        `checkoutRateLimits/${digest({ ip, storeId: context.storeId, window: Math.floor(now() / 300000) })}`,
      );
      const rate = (await tx.get(rateRef)).data();
      if ((rate?.count ?? 0) >= 10)
        fail(
          "resource-exhausted",
          "Muitos pedidos neste intervalo. Aguarde alguns minutos.",
        );
      const session = {
        id: sessionId,
        storeId: context.storeId,
        slug: input.slug,
        fingerprint,
        customer: normalizedCustomer,
        notes,
        fulfillment: input.fulfillment,
        payment: input.payment,
        paymentStatus:
          input.payment === "pix" ? "awaiting_payment" : "due_on_fulfillment",
        ...pricing,
        ...(input.payment === "pix"
          ? { walletId: context.store.asaasWalletId }
          : { orderId: sessionId }),
        createdAt: timestamp(),
      };
      tx.set(rateRef, {
        count: (rate?.count ?? 0) + 1,
        expiresAt: new Date(now() + 86400000),
      });
      tx.create(ref, session);
      if (input.payment !== "pix")
        tx.create(
          db.doc(`tenants/${context.storeId}/orders/${sessionId}`),
          orderFrom(session),
        );
      else
        tx.create(db.doc(`checkoutPayments/${sessionId}`), {
          storeId: context.storeId,
          sessionId,
        });
      return response(session);
    });
  }
  return { handler, capability, response, orderFrom, storeFor };
}
module.exports = { createCheckout };
