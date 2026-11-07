const { randomUUID } = require("node:crypto");
const validId = (value) =>
  typeof value === "string" && /^[a-zA-Z0-9_-]{1,128}$/.test(value);

function createCustomer({
  db,
  auth,
  HttpsError,
  timestamp,
  now = Date.now,
  uuid = randomUUID,
}) {
  const fail = (code, message) => {
    throw new HttpsError(code, message);
  };
  function text(value, min, max, label) {
    const result = typeof value === "string" ? value.trim() : "";
    if (result.length < min || result.length > max)
      fail("invalid-argument", `Confira ${label}.`);
    return result;
  }
  async function identity(request) {
    const uid = request.auth?.uid;
    if (!validId(uid))
      fail("unauthenticated", "Entre na sua conta de cliente.");
    const user = await auth.getUser(uid);
    const revoked =
      Date.parse(user.tokensValidAfterTime || "1970-01-01") / 1000;
    if (
      user.disabled ||
      !Number.isFinite(request.auth.token?.auth_time) ||
      request.auth.token.auth_time < revoked
    )
      fail("unauthenticated", "Sua sessão expirou. Entre novamente.");
    return user;
  }
  const profileView = (data, user) => ({
    uid: user.uid,
    name: data?.name || user.displayName || "",
    email: user.email || "",
    phone: data?.phone || "",
    emailVerified: user.emailVerified === true,
    addresses: data?.addresses || [],
    favorites: data?.favorites || [],
  });
  async function purchase(uid, pointer) {
    if (!validId(pointer.storeId) || !validId(pointer.checkoutId))
      fail("not-found", "Pedido não encontrado.");
    const session = (
      await db
        .doc(
          `tenants/${pointer.storeId}/checkoutSessions/${pointer.checkoutId}`,
        )
        .get()
    ).data();
    if (!session || session.customerUid !== uid)
      fail("permission-denied", "Este pedido não pertence à sua conta.");
    const order = session.orderId
      ? (
          await db
            .doc(`tenants/${pointer.storeId}/orders/${session.orderId}`)
            .get()
        ).data()
      : null;
    return {
      id: session.id,
      storeName: pointer.storeName,
      slug: pointer.slug,
      createdAtMs: pointer.createdAtMs,
      status:
        order?.status ||
        (session.paymentStatus === "expired" ? "expired" : "awaiting_payment"),
      payment: session.payment,
      paymentStatus: order?.paymentStatus || session.paymentStatus,
      totalCents: session.totalCents,
      shippingCents: session.shippingCents,
      fulfillment: session.fulfillment,
      address: session.customer.address,
      notes: session.notes,
      lines: session.lines,
      cancellationReason: order?.cancellationReason || "",
    };
  }
  async function handler(request) {
    const user = await identity(request),
      uid = user.uid,
      input = request.data || {};
    const ref = db.doc(`customers/${uid}`);
    if (input.action === "profile")
      return profileView((await ref.get()).data(), user);
    if (input.action === "orders") {
      let query = db
        .collection(`customers/${uid}/orders`)
        .orderBy("createdAtMs", "desc")
        .orderBy("__name__", "desc");
      if (input.cursor) {
        if (
          !Number.isSafeInteger(input.cursor.createdAtMs) ||
          !validId(input.cursor.id)
        )
          fail("invalid-argument", "Página inválida.");
        query = query.startAfter(input.cursor.createdAtMs, input.cursor.id);
      }
      const docs = (await query.limit(21).get()).docs;
      const page = docs.slice(0, 20);
      const orders = await Promise.all(
        page.map((doc) => purchase(uid, doc.data())),
      );
      const last = page.at(-1);
      return {
        orders,
        cursor:
          docs.length > 20
            ? { createdAtMs: last.data().createdAtMs, id: last.id }
            : null,
      };
    }
    if (input.action === "order") {
      if (!validId(input.id)) fail("invalid-argument", "Pedido inválido.");
      const pointer = (
        await db.doc(`customers/${uid}/orders/${input.id}`).get()
      ).data();
      if (!pointer) fail("not-found", "Pedido não encontrado na sua conta.");
      return purchase(uid, pointer);
    }
    if (
      !["saveProfile", "saveAddress", "deleteAddress", "favorite"].includes(
        input.action,
      )
    )
      fail("invalid-argument", "Operação inválida.");
    // A store name is read from the trusted directory, never from the visitor.
    let favorite;
    if (input.action === "favorite") {
      if (
        typeof input.slug !== "string" ||
        !/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(input.slug) ||
        typeof input.remove !== "boolean"
      )
        fail("invalid-argument", "Restaurante inválido.");
      if (!input.remove) {
        const domain = (
          await db.doc(`tenantDomains/${input.slug}`).get()
        ).data();
        if (!validId(domain?.tenantId))
          fail("not-found", "Restaurante não encontrado.");
        const store = (await db.doc(`tenants/${domain.tenantId}`).get()).data();
        if (store?.status !== "active")
          fail("not-found", "Restaurante indisponível.");
        favorite = { slug: input.slug, name: store.name };
      }
    }
    return db.runTransaction(async (tx) => {
      const previous = (await tx.get(ref)).data();
      const profile = {
        name: previous?.name || user.displayName || "",
        phone: previous?.phone || "",
        addresses: previous?.addresses || [],
        favorites: previous?.favorites || [],
      };
      if (input.action === "saveProfile") {
        profile.name = text(input.name, 2, 100, "seu nome");
        const phone =
          typeof input.phone === "string" ? input.phone.replace(/\D/g, "") : "";
        if (phone && !/^\d{10,11}$/.test(phone))
          fail("invalid-argument", "Informe um telefone com DDD.");
        profile.phone = phone;
      }
      if (input.action === "saveAddress") {
        const address = input.address || {};
        const id = address.id || uuid();
        if (!validId(id)) fail("invalid-argument", "Endereço inválido.");
        const saved = {
          id,
          label: text(address.label, 2, 40, "o nome do endereço"),
          street: text(address.street, 2, 120, "a rua"),
          number: text(address.number, 1, 20, "o número"),
          complement: text(address.complement, 0, 100, "o complemento"),
          neighborhood: text(address.neighborhood, 2, 80, "o bairro"),
          city: text(address.city, 2, 80, "a cidade"),
          state: text(address.state, 2, 2, "o estado").toUpperCase(),
          zip:
            typeof address.zip === "string"
              ? address.zip.replace(/\D/g, "")
              : "",
          isDefault: address.isDefault === true,
        };
        if (
          !"AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO"
            .split(" ")
            .includes(saved.state) ||
          !/^\d{8}$/.test(saved.zip)
        )
          fail("invalid-argument", "Confira o estado e o CEP.");
        const rest = profile.addresses.filter((item) => item.id !== id);
        if (rest.length >= 5)
          fail("resource-exhausted", "Você pode salvar até 5 endereços.");
        if (!rest.length) saved.isDefault = true;
        profile.addresses = [
          ...rest.map((item) => ({
            ...item,
            isDefault: saved.isDefault ? false : item.isDefault,
          })),
          saved,
        ];
        if (!profile.addresses.some((item) => item.isDefault))
          profile.addresses[0].isDefault = true;
      }
      if (input.action === "deleteAddress") {
        if (!validId(input.id)) fail("invalid-argument", "Endereço inválido.");
        profile.addresses = profile.addresses.filter(
          (item) => item.id !== input.id,
        );
        if (
          profile.addresses.length &&
          !profile.addresses.some((item) => item.isDefault)
        )
          profile.addresses[0] = { ...profile.addresses[0], isDefault: true };
      }
      if (input.action === "favorite") {
        profile.favorites = profile.favorites.filter(
          (item) => item.slug !== input.slug,
        );
        if (favorite) {
          if (profile.favorites.length >= 50)
            fail(
              "resource-exhausted",
              "O limite é de 50 restaurantes favoritos.",
            );
          profile.favorites.push(favorite);
        }
      }
      tx.set(ref, {
        ...profile,
        email: user.email || "",
        createdAt: previous?.createdAt || timestamp(),
        updatedAt: timestamp(),
      });
      return profileView(profile, user);
    });
  }
  return { handler };
}
module.exports = { createCustomer };
