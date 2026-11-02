// Dry-run by default. Run in a trusted environment with ADC and an explicit project.
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldPath } = require("firebase-admin/firestore");
const { storeSearchFields } = require("./store-search.cjs");
async function main() {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT;
  if (!projectId)
    throw new Error("Informe GOOGLE_CLOUD_PROJECT explicitamente.");
  initializeApp({ projectId });
  const db = getFirestore();
  let last,
    scanned = 0,
    changed = 0;
  for (;;) {
    let query = db
      .collection("tenants")
      .orderBy(FieldPath.documentId())
      .limit(200);
    if (last) query = query.startAfter(last);
    const page = await query.get();
    for (const doc of page.docs) {
      scanned++;
      const needsUpdate = await db.runTransaction(async (tx) => {
        const data = (await tx.get(doc.ref)).data();
        if (!data) return;
        const fields = storeSearchFields(data);
        if (
          fields.publicCityKey === data.publicCityKey &&
          fields.publicStateKey === data.publicStateKey
        )
          return;
        if (process.argv.includes("--apply")) tx.update(doc.ref, fields);
        return true;
      });
      if (needsUpdate) changed++;
    }
    if (page.size < 200) break;
    last = page.docs.at(-1);
  }
  console.log(
    JSON.stringify({
      projectId,
      mode: process.argv.includes("--apply") ? "apply" : "dry-run",
      scanned,
      changed,
    }),
  );
}
main().catch(() => {
  console.error(
    "Não foi possível atualizar o índice de regiões. Confira autenticação e projeto.",
  );
  process.exitCode = 1;
});
