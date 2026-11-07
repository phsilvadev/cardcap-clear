const { createHash } = require("node:crypto");
const digest = (value) => createHash("sha256").update(value).digest("hex");

function createWaitlistHandler({
  db,
  HttpsError,
  timestamp,
  verifyTurnstile,
  now = Date.now,
}) {
  return async (request) => {
    const input = request.data;
    if (!input || typeof input !== "object" || Array.isArray(input))
      throw new HttpsError(
        "invalid-argument",
        "Confira os dados da inscrição.",
      );
    if (input.website) return { accepted: true };
    const email =
      typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
    if (
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      input.consent !== true
    )
      throw new HttpsError(
        "invalid-argument",
        "Informe um e-mail válido e aceite receber novidades.",
      );
    if (!verifyTurnstile || !(await verifyTurnstile(input.turnstileToken)))
      throw new HttpsError(
        "permission-denied",
        "Conclua novamente a verificação de segurança.",
      );
    const clock = now();
    const ip = request.rawRequest?.ip || "unknown";
    const limitRef = db.doc(
      `waitlistRateLimits/${digest(`${ip}:${Math.floor(clock / 900000)}`)}`,
    );
    const leadRef = db.doc(`launchWaitlist/${digest(email)}`);
    await db.runTransaction(async (tx) => {
      const [rate, lead] = await Promise.all([
        tx.get(limitRef),
        tx.get(leadRef),
      ]);
      const count = rate.data()?.count || 0;
      if (count >= 5)
        throw new HttpsError(
          "resource-exhausted",
          "Aguarde alguns minutos antes de tentar novamente.",
        );
      tx.set(limitRef, {
        count: count + 1,
        expiresAt: new Date(clock + 1800000),
      });
      if (!lead.exists)
        tx.create(leadRef, {
          email,
          source: "coming-soon",
          status: "subscribed",
          consent: { version: "launch-news-v1", acceptedAt: timestamp() },
          createdAt: timestamp(),
        });
    });
    return { accepted: true };
  };
}
module.exports = { createWaitlistHandler };
