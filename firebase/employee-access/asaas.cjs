function createAsaas({ apiKey, environment = "sandbox", fetchImpl = fetch }) {
  if (!["sandbox", "production"].includes(environment))
    throw new Error("Ambiente Asaas inválido.");
  const base =
    environment === "production"
      ? "https://api.asaas.com/v3"
      : "https://api-sandbox.asaas.com/v3";
  async function request(path, method = "GET", body) {
    const key = typeof apiKey === "function" ? apiKey() : apiKey;
    if (!key) throw new Error("Asaas não configurado.");
    let response;
    try {
      response = await fetchImpl(base + path, {
        method,
        headers: {
          access_token: key,
          "Content-Type": "application/json",
          "User-Agent": "Cardap Checkout",
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: AbortSignal.timeout(10000),
      });
    } catch {
      throw new Error("Resposta do Asaas não confirmada.");
    }
    if (!response.ok)
      throw Object.assign(new Error("O Asaas não confirmou a operação."), {
        knownRejected: [400, 401, 403, 404, 422].includes(response.status),
      });
    return response.json();
  }
  return {
    environment,
    async customer(session) {
      const found = await request(
        `/customers?externalReference=${encodeURIComponent(session.id)}&limit=2`,
      );
      if (found.data?.length > 1)
        throw new Error("Cliente precisa de conferência.");
      if (found.data?.[0]) return found.data[0].id;
      return (
        await request("/customers", "POST", {
          name: session.customer.name,
          cpfCnpj: session.customer.cpf,
          mobilePhone: session.customer.phone,
          externalReference: session.id,
          notificationDisabled: true,
        })
      ).id;
    },
    async findPayment(reference) {
      const found = await request(
        `/payments?externalReference=${encodeURIComponent(reference)}&limit=2`,
      );
      if (found.data?.length > 1)
        throw new Error("Mais de uma cobrança precisa de conferência.");
      return found.data?.[0] ?? null;
    },
    createPayment(session, customer) {
      return request("/payments", "POST", {
        customer,
        billingType: "PIX",
        value: session.totalCents / 100,
        dueDate: new Intl.DateTimeFormat("en-CA", {
          timeZone: "America/Sao_Paulo",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date()),
        externalReference: session.id,
        description: `Pedido ${session.id}`,
        split: [{ walletId: session.walletId, percentualValue: 100 }],
      });
    },
    getPayment: (paymentId) =>
      request(`/payments/${encodeURIComponent(paymentId)}`),
    qrCode: (paymentId) =>
      request(`/payments/${encodeURIComponent(paymentId)}/pixQrCode`),
  };
}
module.exports = { createAsaas };
