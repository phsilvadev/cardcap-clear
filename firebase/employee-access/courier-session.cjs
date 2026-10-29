exports.createCourierSessionHandler =
  ({ db, auth, HttpsError }) =>
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
      throw new HttpsError(
        "unauthenticated",
        "Entre com seu acesso de entregador.",
      );
    const account = await auth.getUser(uid);
    const validAfter = Date.parse(account.tokensValidAfterTime ?? "") / 1000;
    if (
      account.disabled ||
      (Number.isFinite(validAfter) &&
        typeof request.auth.token?.auth_time === "number" &&
        request.auth.token.auth_time < validAfter)
    )
      throw new HttpsError(
        "permission-denied",
        "Seu acesso de entregador não está ativo.",
      );
    const mapping = (await db.doc(`courierAccounts/${uid}`).get()).data();
    const validId = (value) =>
      typeof value === "string" &&
      value.length > 0 &&
      value.length <= 128 &&
      !value.includes("/");
    if (!mapping || !validId(mapping.storeId) || !validId(mapping.employeeId))
      throw new HttpsError(
        "permission-denied",
        "Seu acesso de entregador não está ativo.",
      );
    const { storeId, employeeId } = mapping;
    const [storeSnapshot, employeeSnapshot] = await Promise.all([
      db.doc(`tenants/${storeId}`).get(),
      db.doc(`tenants/${storeId}/employees/${employeeId}`).get(),
    ]);
    const store = storeSnapshot.data();
    const employee = employeeSnapshot.data();
    if (
      !store ||
      !["configured", "active"].includes(store.status) ||
      !employee ||
      employee.uid !== uid ||
      employee.storeId !== storeId ||
      employee.role !== "courier" ||
      employee.active !== true ||
      typeof employee.name !== "string" ||
      typeof employee.email !== "string" ||
      !["motorcycle", "bicycle", "car", "foot"].includes(employee.vehicle)
    )
      throw new HttpsError(
        "permission-denied",
        "Seu acesso de entregador não está ativo.",
      );
    return {
      uid,
      storeId,
      employeeId,
      name: employee.name,
      email: employee.email,
      phone: typeof employee.phone === "string" ? employee.phone : "",
      vehicle: employee.vehicle,
      storeName:
        typeof store.name === "string" ? store.name : "Seu restaurante",
      storePhone: typeof store.phone === "string" ? store.phone : "",
    };
  };
