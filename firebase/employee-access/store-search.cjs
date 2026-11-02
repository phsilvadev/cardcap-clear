const normalizeCity = (value) =>
  typeof value === "string"
    ? value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ")
    : "";
function storeSearchFields(data) {
  return {
    publicCityKey: normalizeCity(data.city),
    publicStateKey:
      typeof data.state === "string" ? data.state.trim().toUpperCase() : "",
  };
}
function createStoreSearchSync({ db }) {
  return async (event) => {
    const ref = event.data?.after?.ref;
    if (!ref || event.data.after.exists === false) return;
    // Read current values in a transaction: old trigger deliveries cannot overwrite a newer address.
    await db.runTransaction(async (tx) => {
      const current = await tx.get(ref);
      const data = current.data();
      if (!data) return;
      const keys = storeSearchFields(data);
      if (
        data.publicCityKey !== keys.publicCityKey ||
        data.publicStateKey !== keys.publicStateKey
      )
        tx.update(ref, keys);
    });
  };
}
module.exports = { normalizeCity, storeSearchFields, createStoreSearchSync };
