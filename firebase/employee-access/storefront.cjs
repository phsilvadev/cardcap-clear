const slugPattern = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;
const idPattern = /^[a-zA-Z0-9_-]{1,128}$/;
const normalize = (value) =>
  typeof value === "string"
    ? value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase()
    : "";
const text = (value, max = 100) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";
function publicStore(data) {
  return {
    slug: data.slug,
    name: text(data.name, 80),
    description: text(data.description, 1000),
    category: text(data.category, 40),
    logoUrl:
      typeof data.logoUrl === "string" &&
      data.logoUrl.startsWith("https://firebasestorage.googleapis.com/")
        ? data.logoUrl
        : null,
    receivingOrders: data.status === "active" && data.receivingOrders === true,
    city: text(data.city),
    state: text(data.state, 2),
    street: text(data.street, 160),
    number: text(data.number, 20),
    district: text(data.district),
    openingDay: text(data.openingDay, 20),
    closingDay: text(data.closingDay, 20),
    openingTime: text(data.openingTime, 5),
    closingTime: text(data.closingTime, 5),
    acceptsDelivery: data.acceptsDelivery === true,
    acceptsPickup: data.acceptsPickup === true,
    deliveryTime: text(data.deliveryTime, 80),
    deliveryFeeCents:
      Number.isSafeInteger(data.deliveryFeeCents) && data.deliveryFeeCents >= 0
        ? data.deliveryFeeCents
        : null,
  };
}
function createReceivingHandler({ db, HttpsError, timestamp }) {
  return async (request) => {
    if (!request.auth)
      throw new HttpsError(
        "unauthenticated",
        "Entre com a conta do proprietário.",
      );
    const { storeId, receivingOrders } = request.data ?? {};
    if (
      typeof storeId !== "string" ||
      !idPattern.test(storeId) ||
      typeof receivingOrders !== "boolean"
    )
      throw new HttpsError(
        "invalid-argument",
        "Confira o recebimento de pedidos.",
      );
    if (request.auth.uid !== storeId)
      throw new HttpsError("permission-denied", "Acesso negado.");
    await db.runTransaction(async (tx) => {
      const ref = db.doc(`tenants/${storeId}`);
      const data = (await tx.get(ref)).data();
      if (
        !data ||
        data.ownerUid !== storeId ||
        !["configured", "active"].includes(data.status)
      )
        throw new HttpsError(
          "permission-denied",
          "Conclua o cadastro da loja com a conta do proprietário.",
        );
      tx.update(ref, { receivingOrders, updatedAt: timestamp() });
    });
    return { receivingOrders };
  };
}
function createStorefrontHandler({
  db,
  HttpsError,
  imageUrl = async () => null,
}) {
  const fail = (code, message) => {
    throw new HttpsError(code, message);
  };
  return async (request) => {
    const { action, slug, city, state, cursor, productCursor, preview } =
      request.data ?? {};
    if (action === "list") {
      if (
        typeof city !== "string" ||
        city.trim().length < 2 ||
        city.length > 100 ||
        typeof state !== "string" ||
        !/^[A-Z]{2}$/.test(state) ||
        (cursor !== undefined &&
          (typeof cursor !== "string" || !idPattern.test(cursor)))
      )
        fail("invalid-argument", "Informe sua cidade e estado.");
      let query = db
        .collection("tenants")
        .where("status", "==", "active")
        .orderBy("__name__");
      if (cursor) query = query.startAfter(cursor);
      const result = await query.limit(40).get();
      const stores = result.docs
        .filter((doc) => {
          const data = doc.data();
          return (
            data.ownerUid === doc.id &&
            data.status === "active" &&
            typeof data.slug === "string" &&
            slugPattern.test(data.slug) &&
            normalize(data.city) === normalize(city) &&
            text(data.state, 2).toUpperCase() === state
          );
        })
        .map((doc) => publicStore(doc.data()));
      return {
        stores,
        nextCursor: result.docs.length === 40 ? result.docs.at(-1).id : null,
      };
    }
    if (
      !["get", "summary"].includes(action) ||
      typeof slug !== "string" ||
      !slugPattern.test(slug) ||
      (productCursor !== undefined &&
        (typeof productCursor !== "string" || !idPattern.test(productCursor)))
    )
      fail("invalid-argument", "Loja inválida.");
    const tenantId = (await db.doc(`tenantDomains/${slug}`).get()).data()
      ?.tenantId;
    if (typeof tenantId !== "string" || !idPattern.test(tenantId))
      fail("not-found", "Esta loja não está disponível.");
    const ref = db.doc(`tenants/${tenantId}`);
    const data = (await ref.get()).data();
    const ownerPreview =
      preview === true &&
      request.auth?.uid === tenantId &&
      data?.ownerUid === tenantId &&
      ["configured", "active"].includes(data?.status);
    if (
      !data ||
      data.ownerUid !== tenantId ||
      data.slug !== slug ||
      (data.status !== "active" && !ownerPreview)
    )
      fail("not-found", "Esta loja não está disponível.");
    const store = publicStore(data);
    if (action === "summary")
      return { store, preview: ownerPreview && data.status !== "active" };
    let productsQuery = ref
      .collection("products")
      .where("available", "==", true)
      .orderBy("__name__");
    if (productCursor) productsQuery = productsQuery.startAfter(productCursor);
    const [categoriesResult, productsResult] = await Promise.all([
      ref.collection("categories").orderBy("name").limit(100).get(),
      productsQuery.limit(30).get(),
    ]);
    const categories = categoriesResult.docs
      .filter(
        (doc) => doc.data().storeId === tenantId && idPattern.test(doc.id),
      )
      .map((doc) => ({ id: doc.id, name: text(doc.data().name, 60) }));
    const categoriesById = new Set(categories.map((item) => item.id));
    const products = await Promise.all(
      productsResult.docs
        .filter((doc) => {
          const item = doc.data();
          return (
            item.storeId === tenantId &&
            item.available === true &&
            idPattern.test(doc.id) &&
            categoriesById.has(item.categoryId) &&
            typeof item.name === "string" &&
            Number.isSafeInteger(item.priceCents) &&
            item.priceCents >= 0
          );
        })
        .map(async (doc) => {
          const item = doc.data();
          const path = `tenants/${tenantId}/products/${doc.id}/image`;
          return {
            id: doc.id,
            name: text(item.name),
            description: text(item.description, 1000),
            priceCents: item.priceCents,
            categoryId: item.categoryId,
            imageUrl: item.imagePath === path ? await imageUrl(path) : null,
          };
        }),
    );
    return {
      store,
      categories,
      products,
      nextProductCursor:
        productsResult.docs.length === 30
          ? productsResult.docs.at(-1).id
          : null,
      preview: ownerPreview && data.status !== "active",
    };
  };
}
exports.createReceivingHandler = createReceivingHandler;
exports.createStorefrontHandler = createStorefrontHandler;
exports.publicStore = publicStore;
