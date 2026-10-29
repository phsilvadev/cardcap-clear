// Dependencies are injected so authorization can be tested without Firebase.
exports.createAccessLinkHandler =
  ({ db, auth, HttpsError }) =>
  async (request) => {
    if (!request.auth)
      throw new HttpsError(
        "unauthenticated",
        "Entre com a conta do proprietário.",
      );
    const { storeId, employeeId } = request.data ?? {};
    if (
      typeof storeId !== "string" ||
      typeof employeeId !== "string" ||
      !storeId ||
      !employeeId ||
      storeId.length > 128 ||
      employeeId.length > 128 ||
      storeId.includes("/") ||
      employeeId.includes("/")
    )
      throw new HttpsError("invalid-argument", "Funcionário inválido.");
    if (request.auth.uid !== storeId)
      throw new HttpsError("permission-denied", "Acesso negado.");
    const tenant = (await db.doc(`tenants/${storeId}`).get()).data();
    if (
      !tenant ||
      tenant.ownerUid !== request.auth.uid ||
      !["configured", "active"].includes(tenant.status)
    )
      throw new HttpsError("permission-denied", "Acesso negado.");
    const employee = (
      await db.doc(`tenants/${storeId}/employees/${employeeId}`).get()
    ).data();
    // uid must be a server-created binding, never inferred from a client-editable email or document ID.
    if (
      !employee ||
      employee.storeId !== storeId ||
      employee.active !== true ||
      !["attendant", "manager"].includes(employee.role) ||
      typeof employee.uid !== "string" ||
      !employee.uid ||
      employee.uid === storeId
    )
      throw new HttpsError(
        "failed-precondition",
        "O funcionário precisa de um vínculo de acesso válido e ativo.",
      );
    const user = await auth.getUser(employee.uid);
    if (
      user.disabled ||
      !user.email ||
      user.email.toLowerCase() !== employee.email?.toLowerCase()
    )
      throw new HttpsError(
        "failed-precondition",
        "O vínculo de acesso precisa ser atualizado.",
      );
    // Generates a Firebase action link only. Does not dispatch email or persist the link.
    const link = await auth.generatePasswordResetLink(user.email);
    return { link };
  };
