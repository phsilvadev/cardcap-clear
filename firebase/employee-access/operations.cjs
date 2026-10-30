exports.createOperationsHandler =
  ({ db, HttpsError, timestamp }) =>
  async (request) => {
    if (!request.auth)
      throw new HttpsError("unauthenticated", "Entre com sua conta.");
    const { storeId, salon, ownDelivery } = request.data ?? {};
    if (
      typeof storeId !== "string" ||
      !storeId ||
      storeId.length > 128 ||
      storeId.includes("/") ||
      typeof salon !== "boolean" ||
      typeof ownDelivery !== "boolean"
    )
      throw new HttpsError(
        "invalid-argument",
        "Confira as opções da operação.",
      );
    if (request.auth.uid !== storeId)
      throw new HttpsError("permission-denied", "Acesso negado.");
    const ref = db.doc(`tenants/${storeId}`);
    const operations = { salon, ownDelivery };
    await db.runTransaction(async (transaction) => {
      const tenant = (await transaction.get(ref)).data();
      if (
        !tenant ||
        tenant.ownerUid !== request.auth.uid ||
        !["configured", "active"].includes(tenant.status)
      )
        throw new HttpsError(
          "permission-denied",
          "Conclua o cadastro da loja com a conta do proprietário.",
        );
      transaction.update(ref, { operations, updatedAt: timestamp() });
    });
    return { operations };
  };
