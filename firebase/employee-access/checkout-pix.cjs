const { randomUUID, timingSafeEqual } = require("node:crypto");
function createCheckoutPix({
  db,
  checkout,
  provider,
  HttpsError,
  now = Date.now,
  timestamp,
  uuid = randomUUID,
}) {
  const fail = (code, message) => {
    throw new HttpsError(code, message);
  };
  function checkPayment(payment, session) {
    if (
      !payment ||
      typeof payment.id !== "string" ||
      !/^pay_[a-zA-Z0-9_-]+$/.test(payment.id) ||
      payment.billingType !== "PIX" ||
      payment.externalReference !== session.id ||
      payment.customer !== session.providerCustomerId ||
      Math.round(Number(payment.value) * 100) !== session.totalCents ||
      (session.providerPaymentId && session.providerPaymentId !== payment.id)
    )
      fail(
        "failed-precondition",
        "A cobrança precisa ser conferida pelo suporte.",
      );
  }
  async function handler(request) {
    const input = request.data ?? {};
    const sessionId = checkout.capability(input);
    const index = (await db.doc(`checkoutPayments/${sessionId}`).get()).data();
    if (!index) fail("not-found", "Pedido Pix não encontrado.");
    const ref = db.doc(
      `tenants/${index.storeId}/checkoutSessions/${sessionId}`,
    );
    const leaseToken = uuid();
    let session = await db.runTransaction(async (tx) => {
      const data = (await tx.get(ref)).data();
      if (
        !data ||
        data.slug !== input.slug ||
        data.payment !== "pix" ||
        data.paymentStatus === "refunded"
      )
        fail("failed-precondition", "Pedido indisponível para pagamento.");
      if (
        data.providerEnvironment &&
        data.providerEnvironment !== provider.environment
      )
        fail(
          "failed-precondition",
          "A configuração de pagamentos mudou. Procure o suporte.",
        );
      if (data.leaseUntil > now())
        fail(
          "aborted",
          "Aguarde a preparação do Pix antes de tentar novamente.",
        );
      tx.update(ref, {
        leaseToken,
        leaseUntil: now() + 30000,
        providerEnvironment: provider.environment,
      });
      return data;
    });
    try {
      if (session.providerPaymentId) {
        const payment = await provider.getPayment(session.providerPaymentId);
        checkPayment(payment, session);
        return {
          qr: await provider.qrCode(payment.id),
          environment: provider.environment,
        };
      }
      let payment;
      if (session.paymentAttempted) {
        payment = await provider.findPayment(sessionId);
        if (!payment)
          fail(
            "unavailable",
            "O último envio ainda não foi confirmado pelo Asaas. Não gere outra cobrança; tente conferir novamente ou contate a loja.",
          );
      } else {
        const customerId =
          session.providerCustomerId ?? (await provider.customer(session));
        if (
          typeof customerId !== "string" ||
          !/^cus_[a-zA-Z0-9_-]+$/.test(customerId)
        )
          fail(
            "unavailable",
            "Não foi possível preparar o cadastro do pagador.",
          );
        await db.runTransaction(async (tx) => {
          const data = (await tx.get(ref)).data();
          if (data.leaseToken !== leaseToken || data.paymentAttempted)
            fail("aborted", "A preparação do Pix mudou. Confira novamente.");
          tx.update(ref, {
            providerCustomerId: customerId,
            paymentAttempted: true,
          });
        });
        session = { ...session, providerCustomerId: customerId };
        try {
          payment = await provider.createPayment(session, customerId);
        } catch (error) {
          if (error.knownRejected)
            await db.runTransaction(async (tx) => {
              const data = (await tx.get(ref)).data();
              if (data.leaseToken === leaseToken && !data.providerPaymentId)
                tx.update(ref, { paymentAttempted: false });
            });
          throw error;
        }
      }
      checkPayment(payment, session);
      await db.runTransaction(async (tx) => {
        const data = (await tx.get(ref)).data();
        if (data.providerPaymentId && data.providerPaymentId !== payment.id)
          fail(
            "failed-precondition",
            "Existe outra cobrança para este pedido.",
          );
        if (data.leaseToken !== leaseToken)
          fail("aborted", "A preparação do Pix mudou. Confira novamente.");
        tx.update(ref, { providerPaymentId: payment.id });
      });
      return {
        qr: await provider.qrCode(payment.id),
        environment: provider.environment,
      };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      fail(
        "unavailable",
        "Não foi possível confirmar o Pix. Tente conferir o mesmo pedido novamente.",
      );
    } finally {
      await db
        .runTransaction(async (tx) => {
          const data = (await tx.get(ref)).data();
          if (data?.leaseToken === leaseToken)
            tx.update(ref, { leaseUntil: 0 });
        })
        .catch(() => {});
    }
  }
  async function applyPayment(paymentId) {
    // Never trust payment values or status received directly in the webhook body.
    const payment = await provider.getPayment(paymentId);
    if (
      typeof payment.externalReference !== "string" ||
      !/^web-[a-f0-9]{40}$/.test(payment.externalReference)
    )
      return;
    const index = (
      await db.doc(`checkoutPayments/${payment.externalReference}`).get()
    ).data();
    if (!index) return;
    const ref = db.doc(
      `tenants/${index.storeId}/checkoutSessions/${index.sessionId}`,
    );
    await db.runTransaction(async (tx) => {
      const session = (await tx.get(ref)).data();
      if (!session || session.providerEnvironment !== provider.environment)
        fail("failed-precondition", "Pedido de outro ambiente.");
      checkPayment(payment, session);
      if (
        [
          "REFUNDED",
          "REFUND_IN_PROGRESS",
          "CHARGEBACK_REQUESTED",
          "CHARGEBACK_DISPUTE",
        ].includes(payment.status)
      ) {
        tx.update(ref, {
          paymentStatus: "refunded",
          providerPaymentId: payment.id,
          updatedAt: timestamp(),
        });
        if (session.orderId)
          tx.update(
            db.doc(`tenants/${session.storeId}/orders/${session.orderId}`),
            {
              paymentStatus: "refunded",
              paymentReviewRequired: true,
              updatedAt: timestamp(),
            },
          );
        return;
      }
      if (
        (payment.deleted === true || payment.status === "OVERDUE") &&
        !["paid", "refunded"].includes(session.paymentStatus)
      ) {
        tx.update(ref, {
          paymentStatus: "expired",
          providerPaymentId: payment.id,
          updatedAt: timestamp(),
        });
        return;
      }
      if (payment.status !== "RECEIVED" || session.paymentStatus === "refunded")
        return;
      const orderRef = db.doc(
        `tenants/${session.storeId}/orders/${session.id}`,
      );
      const existing = await tx.get(orderRef);
      const paid = { ...session, paymentStatus: "paid", orderId: session.id };
      if (!existing.exists) tx.create(orderRef, checkout.orderFrom(paid));
      tx.update(ref, {
        paymentStatus: "paid",
        orderId: session.id,
        providerPaymentId: payment.id,
        updatedAt: timestamp(),
      });
    });
  }
  return { handler, applyPayment };
}
function validWebhookToken(received, expected) {
  if (
    typeof received !== "string" ||
    typeof expected !== "string" ||
    expected.length < 20
  )
    return false;
  const a = Buffer.from(received),
    b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
module.exports = { createCheckoutPix, validWebhookToken };
