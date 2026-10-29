exports.createCourierHandler =
  ({ db, HttpsError, timestamp }) =>
  async (request) => {
    if (!request.auth)
      throw new HttpsError(
        "unauthenticated",
        "Entre com a conta do proprietário.",
      );
    const input = request.data ?? {};
    const storeId = input.storeId;
    if (
      typeof storeId !== "string" ||
      !storeId ||
      storeId.length > 128 ||
      storeId.includes("/")
    )
      throw new HttpsError("invalid-argument", "Loja inválida.");
    if (storeId !== request.auth.uid)
      throw new HttpsError("permission-denied", "Acesso negado.");
    const name =
      typeof input.name === "string"
        ? input.name.trim().replace(/\s+/g, " ")
        : "";
    const email =
      typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
    const phone =
      typeof input.phone === "string" ? input.phone.replace(/\D/g, "") : "";
    const vehicle = input.vehicle ?? "motorcycle";
    if (
      name.length < 3 ||
      name.length > 100 ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !/^\d{10,11}$/.test(phone) ||
      !["motorcycle", "bicycle", "car", "foot"].includes(vehicle)
    )
      throw new HttpsError(
        "invalid-argument",
        "Confira os dados do entregador.",
      );
    const tenant = db.doc(`tenants/${storeId}`);
    const employees = tenant.collection("employees");
    const employee = employees.doc();
    await db.runTransaction(async (transaction) => {
      const store = (await transaction.get(tenant)).data();
      if (
        !store ||
        store.ownerUid !== request.auth.uid ||
        !["configured", "active"].includes(store.status)
      )
        throw new HttpsError("permission-denied", "Acesso negado.");
      const existing = await transaction.get(
        employees.where("email", "==", email).limit(1),
      );
      if (!existing.empty)
        throw new HttpsError(
          "already-exists",
          "Este e-mail já está cadastrado na equipe.",
        );
      transaction.create(employee, {
        storeId,
        name,
        email,
        phone,
        vehicle,
        role: "courier",
        active: true,
        invited: false,
        createdAt: timestamp(),
      });
    });
    return { employeeId: employee.id };
  };
