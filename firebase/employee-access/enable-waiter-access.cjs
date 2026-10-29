exports.createEnableWaiterAccessHandler =
  ({ db, auth, HttpsError }) =>
  async (request) => {
    if (!request.auth)
      throw new HttpsError(
        "unauthenticated",
        "Entre com a conta do proprietário.",
      );
    const { storeId, employeeId } = request.data ?? {};
    const validId = (value) =>
      typeof value === "string" &&
      value.length > 0 &&
      value.length <= 128 &&
      !value.includes("/");
    if (!validId(storeId) || !validId(employeeId))
      throw new HttpsError("invalid-argument", "Funcionário inválido.");
    if (storeId !== request.auth.uid)
      throw new HttpsError("permission-denied", "Acesso negado.");
    const tenantRef = db.doc(`tenants/${storeId}`);
    const employeeRef = db.doc(`tenants/${storeId}/employees/${employeeId}`);
    const assertOwner = (store) => {
      if (
        !store ||
        store.ownerUid !== request.auth.uid ||
        !["configured", "active"].includes(store.status)
      )
        throw new HttpsError("permission-denied", "Acesso negado.");
    };
    const assertWaiter = (employee) => {
      if (
        !employee ||
        employee.storeId !== storeId ||
        employee.role !== "waiter" ||
        employee.active !== true ||
        typeof employee.email !== "string" ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employee.email)
      )
        throw new HttpsError(
          "failed-precondition",
          "O garçom precisa de um cadastro válido e ativo.",
        );
    };
    assertOwner((await tenantRef.get()).data());
    const employee = (await employeeRef.get()).data();
    assertWaiter(employee);
    let uid = employee.uid;
    if (uid) {
      if (!validId(uid) || uid === storeId)
        throw new HttpsError("failed-precondition", "Vínculo inválido.");
      const mapping = (await db.doc(`waiterAccounts/${uid}`).get()).data();
      if (
        !mapping ||
        mapping.storeId !== storeId ||
        mapping.employeeId !== employeeId
      )
        throw new HttpsError(
          "failed-precondition",
          "O vínculo de acesso precisa ser atualizado.",
        );
      const user = await auth.getUser(uid);
      if (
        user.disabled ||
        user.email?.toLowerCase() !== employee.email.toLowerCase()
      )
        throw new HttpsError(
          "failed-precondition",
          "O vínculo de acesso precisa ser atualizado.",
        );
    } else {
      let created;
      try {
        created = await auth.createUser({
          email: employee.email,
          displayName: employee.name,
        });
      } catch (error) {
        if (error.code === "auth/email-already-exists")
          throw new HttpsError(
            "already-exists",
            "Este e-mail já possui uma conta. O vínculo deve ser conferido antes de liberar acesso.",
          );
        throw error;
      }
      uid = created.uid;
      const mappingRef = db.doc(`waiterAccounts/${uid}`);
      try {
        await db.runTransaction(async (transaction) => {
          const [storeSnap, employeeSnap] = await Promise.all([
            transaction.get(tenantRef),
            transaction.get(employeeRef),
          ]);
          assertOwner(storeSnap.data());
          const current = employeeSnap.data();
          assertWaiter(current);
          if (current.uid || current.email !== employee.email)
            throw new HttpsError(
              "failed-precondition",
              "O cadastro mudou. Atualize a equipe e tente novamente.",
            );
          transaction.update(employeeRef, { uid, invited: true });
          transaction.create(mappingRef, { storeId, employeeId });
        });
      } catch (error) {
        // Delete only a newly-created, confirmed unbound account; never an existing user's account.
        try {
          const [binding, latest] = await Promise.all([
            mappingRef.get(),
            employeeRef.get(),
          ]);
          if (!binding.exists && latest.data()?.uid !== uid)
            await auth.deleteUser(uid);
        } catch {
          /* Keep the account if binding status cannot be confirmed. */
        }
        throw error;
      }
    }
    return { link: await auth.generatePasswordResetLink(employee.email) };
  };
