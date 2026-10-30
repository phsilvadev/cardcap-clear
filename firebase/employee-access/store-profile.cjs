const {
  normalizeSection,
  profileComplete,
} = require("./store-profile-schema.cjs");
function createStoreProfileHandler({ db, HttpsError, timestamp }) {
  return async (request) => {
    if (!request.auth)
      throw new HttpsError(
        "unauthenticated",
        "Entre com a conta do proprietário.",
      );
    const { storeId, section, values } = request.data ?? {};
    if (typeof storeId !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(storeId))
      throw new HttpsError("invalid-argument", "Restaurante inválido.");
    if (storeId !== request.auth.uid)
      throw new HttpsError(
        "permission-denied",
        "Você não tem acesso a este restaurante.",
      );
    const normalized = normalizeSection(section, values);
    if (normalized.issues.length)
      throw new HttpsError(
        "invalid-argument",
        `Confira: ${normalized.issues.join("; ")}.`,
      );
    return db.runTransaction(async (tx) => {
      const ref = db.doc(`tenants/${storeId}`);
      const tenant = (await tx.get(ref)).data();
      if (
        !tenant ||
        tenant.ownerUid !== storeId ||
        !["pending", "configured", "active"].includes(tenant.status)
      )
        throw new HttpsError(
          "permission-denied",
          "Cadastro da loja indisponível para alteração.",
        );
      if (
        section === "wallet" &&
        tenant.status === "active" &&
        normalized.values.asaasWalletId !== tenant.asaasWalletId
      )
        throw new HttpsError(
          "failed-precondition",
          "Para alterar a carteira de uma loja ativa, entre em contato com o suporte.",
        );
      const data = { ...tenant, ...normalized.values };
      const completed = profileComplete(data);
      const publicFields = {
        ...normalized.values,
        setupCompleted: completed,
        ...(tenant.status === "pending" && completed
          ? { status: "configured" }
          : {}),
      };
      const updates = { ...publicFields, updatedAt: timestamp() };
      if (
        section === "company" &&
        normalized.values.hasCnpj === false &&
        !tenant.cnpjDeclaredAt
      )
        updates.cnpjDeclaredAt = timestamp();
      if (
        section === "company" &&
        normalized.values.hasCnpj === true &&
        (!tenant.cnpjProvidedAt || tenant.cnpj !== normalized.values.cnpj)
      )
        updates.cnpjProvidedAt = timestamp();
      if (tenant.status === "pending" && completed)
        updates.configuredAt = timestamp();
      tx.update(ref, updates);
      return { fields: publicFields };
    });
  };
}
module.exports = { createStoreProfileHandler };
