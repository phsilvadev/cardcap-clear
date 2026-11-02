const { createHash, randomUUID } = require("node:crypto");
const hash = (value) => createHash("sha256").update(value).digest("hex");
function instanceName(projectId, storeId) {
  return `cardap-${hash(projectId).slice(0, 8)}-${hash(storeId).slice(0, 24)}`;
}
function safeQr(value) {
  const raw = value?.base64 || value?.qrcode?.base64;
  return typeof raw === "string" &&
    raw.length < 200000 &&
    /^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(raw)
    ? raw
    : null;
}
function createWhatsAppHandler({
  db,
  HttpsError,
  provider,
  projectId,
  timestamp,
  now = Date.now,
}) {
  return async (request) => {
    if (!request.auth)
      throw new HttpsError(
        "unauthenticated",
        "Entre com a conta do proprietário.",
      );
    const { storeId, action } = request.data || {};
    if (
      typeof storeId !== "string" ||
      !storeId ||
      storeId.length > 128 ||
      storeId.includes("/") ||
      !["status", "connect", "disconnect"].includes(action)
    )
      throw new HttpsError(
        "invalid-argument",
        "Confira os dados da integração.",
      );
    if (request.auth.uid !== storeId)
      throw new HttpsError("permission-denied", "Acesso negado.");
    const ref = db.doc(`tenantWhatsAppIntegrations/${storeId}`);
    const token = randomUUID();
    const mutation = action !== "status";
    await db.runTransaction(async (tx) => {
      const [store, integration] = await Promise.all([
        tx.get(db.doc(`tenants/${storeId}`)),
        tx.get(ref),
      ]);
      const tenant = store.data();
      if (
        !tenant ||
        tenant.ownerUid !== request.auth.uid ||
        !["configured", "active"].includes(tenant.status)
      )
        throw new HttpsError(
          "permission-denied",
          "Conclua o cadastro da loja com a conta do proprietário.",
        );
      const current = integration.data() || {};
      const window = Math.floor(now() / 60000);
      const count = current.window === window ? current.count || 0 : 0;
      if (count >= 60)
        throw new HttpsError(
          "resource-exhausted",
          "Aguarde um minuto antes de tentar novamente.",
        );
      if (mutation && current.lockUntil > now())
        throw new HttpsError(
          "aborted",
          "Uma alteração está em andamento. Aguarde alguns segundos.",
        );
      tx.set(
        ref,
        {
          window,
          count: count + 1,
          ...(mutation ? { lockToken: token, lockUntil: now() + 45000 } : {}),
        },
        { merge: true },
      );
    });
    const instance = instanceName(projectId, storeId);
    let result;
    try {
      if (!provider.configured()) {
        if (mutation)
          throw new HttpsError(
            "failed-precondition",
            "O suporte precisa configurar a Evolution API antes de conectar.",
          );
        return {
          configured: false,
          state: "unavailable",
          qrCode: null,
          qrExpiresAt: null,
        };
      }
      if (action === "disconnect") {
        await provider.disconnect(instance);
        result = { state: "disconnected", qrCode: null, qrExpiresAt: null };
      } else {
        let state = await provider.state(instance);
        let qrCode = null;
        if (action === "connect" && state !== "open") {
          if (state === "missing") {
            try {
              await provider.create(instance);
            } catch (error) {
              if ((await provider.state(instance)) === "missing") throw error;
            }
          }
          const response = await provider.connect(instance);
          state = response?.instance?.state === "open" ? "open" : "connecting";
          qrCode = state === "open" ? null : safeQr(response);
        }
        result = {
          state:
            state === "open"
              ? "connected"
              : state === "connecting"
                ? "connecting"
                : "disconnected",
          qrCode,
          qrExpiresAt: qrCode ? now() + 40000 : null,
        };
      }
      return { configured: true, ...result };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      throw new HttpsError(
        "unavailable",
        "Não foi possível consultar a Evolution API. Tente novamente em instantes.",
      );
    } finally {
      if (mutation)
        await db.runTransaction(async (tx) => {
          const current = (await tx.get(ref)).data();
          if (current?.lockToken === token)
            tx.set(
              ref,
              {
                lockUntil: 0,
                lockToken: null,
                ...(result
                  ? { state: result.state, updatedAt: timestamp() }
                  : {}),
              },
              { merge: true },
            );
        });
    }
  };
}
module.exports = { createWhatsAppHandler, instanceName, safeQr };
