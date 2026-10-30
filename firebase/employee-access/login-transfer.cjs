const { randomBytes, createHash } = require("node:crypto");
const hash = (value) => createHash("sha256").update(value).digest("hex");
function createLoginTransfer({
  db,
  auth,
  HttpsError,
  now = Date.now,
  baseDomain = process.env.AUTH_TENANT_DOMAIN,
  centralOrigin = process.env.AUTH_APP_ORIGIN,
}) {
  const fail = (code, message) => {
    throw new HttpsError(code, message);
  };
  function target(source, slug) {
    let url;
    try {
      url = new URL(source);
    } catch {
      fail("invalid-argument", "Origem inválida.");
    }
    if (url.origin !== source || url.username || url.password)
      fail("invalid-argument", "Origem inválida.");
    if (
      ["localhost", "127.0.0.1"].includes(url.hostname) &&
      ["http:", "https:"].includes(url.protocol)
    )
      url.hostname = `${slug}.localhost`;
    else if (
      source === centralOrigin &&
      url.protocol === "https:" &&
      /^[a-z0-9.-]+$/.test(baseDomain || "")
    )
      url.hostname = `${slug}.${baseDomain}`;
    else fail("permission-denied", "Origem de login não autorizada.");
    return url.origin;
  }
  function checkTenant(data, uid, slug) {
    if (
      !data ||
      data.ownerUid !== uid ||
      !["pending", "configured", "active"].includes(data.status) ||
      !/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(data.slug || "") ||
      (slug && slug !== data.slug)
    )
      fail("permission-denied", "Restaurante sem acesso.");
  }
  async function checkUser(uid, authTime) {
    const user = await auth.getUser(uid);
    if (
      user.disabled ||
      authTime < Date.parse(user.tokensValidAfterTime || "1970-01-01") / 1000
    )
      fail("unauthenticated", "Sessão inválida ou revogada.");
  }
  return async (request) => {
    const data = request.data ?? {};
    const origin =
      request.rawRequest?.get?.("origin") ||
      request.rawRequest?.headers?.origin;
    if (data.action === "create") {
      if (!request.auth)
        fail("unauthenticated", "Entre com a conta do proprietário.");
      const uid = request.auth.uid;
      const authTime = request.auth.token?.auth_time;
      if (!Number.isFinite(authTime))
        fail("unauthenticated", "Sessão inválida.");
      await checkUser(uid, authTime);
      const tenant = (await db.doc(`tenants/${uid}`).get()).data();
      checkTenant(tenant, uid);
      const destinationOrigin = target(data.sourceOrigin, tenant.slug);
      if (origin !== data.sourceOrigin)
        fail("permission-denied", "Origem incompatível com o login.");
      if (
        (await db.doc(`tenantDomains/${tenant.slug}`).get()).data()
          ?.tenantId !== uid
      )
        fail("permission-denied", "Domínio sem vínculo.");
      const code = randomBytes(32).toString("hex");
      await db
        .doc(`loginTransfers/${hash(code)}`)
        .create({
          uid,
          slug: tenant.slug,
          sourceOrigin: data.sourceOrigin,
          destinationOrigin,
          authTime,
          expiresAt: now() + 60000,
        });
      return { code, destinationOrigin };
    }
    if (data.action === "redeem") {
      if (typeof data.code !== "string" || !/^[a-f0-9]{64}$/.test(data.code))
        fail("invalid-argument", "Transferência inválida.");
      const ref = db.doc(`loginTransfers/${hash(data.code)}`);
      const initial = (await ref.get()).data();
      if (
        !initial ||
        initial.expiresAt <= now() ||
        origin !== initial.destinationOrigin
      )
        fail("permission-denied", "Transferência expirada ou incompatível.");
      await checkUser(initial.uid, initial.authTime);
      await db.runTransaction(async (tx) => {
        const [ticket, tenant, domain] = await Promise.all([
          tx.get(ref),
          tx.get(db.doc(`tenants/${initial.uid}`)),
          tx.get(db.doc(`tenantDomains/${initial.slug}`)),
        ]);
        const entry = ticket.data();
        if (
          !entry ||
          entry.uid !== initial.uid ||
          entry.expiresAt <= now() ||
          entry.destinationOrigin !== origin
        )
          fail("permission-denied", "Transferência já utilizada ou expirada.");
        checkTenant(tenant.data(), entry.uid, entry.slug);
        if (domain.data()?.tenantId !== entry.uid)
          fail("permission-denied", "Domínio sem vínculo.");
        tx.delete(ref);
      });
      const customToken = await auth.createCustomToken(initial.uid);
      return { customToken, slug: initial.slug };
    }
    fail("invalid-argument", "Operação inválida.");
  };
}
module.exports = { createLoginTransfer };
