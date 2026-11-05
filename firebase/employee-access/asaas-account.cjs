const { createHash, randomUUID } = require("node:crypto");
const { profileComplete, validCnpj } = require("./store-profile-schema.cjs");
const cleanDocument = (value) =>
  String(value || "")
    .toUpperCase()
    .replace(/[.\s/-]/g, "");
const hash = (value) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
const companyBinding = (tenant) =>
  hash([
    tenant.ownerUid,
    tenant.hasCnpj,
    tenant.cnpj || "",
    tenant.ownerName || "",
    tenant.legalName || "",
  ]);
function validCpf(value) {
  if (!/^\d{11}$/.test(value) || /^(.)\1+$/.test(value)) return false;
  for (let length = 9; length < 11; length++) {
    const sum = [...value.slice(0, length)].reduce(
      (n, d, i) => n + Number(d) * (length + 1 - i),
      0,
    );
    const digit = (sum * 10) % 11;
    if (Number(value[length]) !== (digit === 10 ? 0 : digit)) return false;
  }
  return true;
}
function createAsaasAccountHandler({
  db,
  HttpsError,
  timestamp,
  environment = "sandbox",
  fetchImpl = fetch,
  now = Date.now,
}) {
  return async ({ auth, data = {} }) => {
    const fail = (code, message) => {
      throw new HttpsError(code, message);
    };
    if (!auth) fail("unauthenticated", "Entre com a conta do proprietário.");
    const { storeId, action } = data;
    if (
      typeof storeId !== "string" ||
      !/^[a-zA-Z0-9_-]{1,128}$/.test(storeId) ||
      auth.uid !== storeId
    )
      fail("permission-denied", "Você não tem acesso a este restaurante.");
    if (!["sandbox", "production"].includes(environment))
      fail("failed-precondition", "Ambiente Asaas indisponível.");
    if (!["status", "validate", "confirm"].includes(action))
      fail("invalid-argument", "Operação inválida.");
    const ref = db.doc(`tenants/${storeId}`),
      privateRef = db.doc(`tenantAsaasVerification/${storeId}`);
    const owner = (tenant) => {
      if (
        !tenant ||
        tenant.ownerUid !== auth.uid ||
        !["pending", "configured", "active"].includes(tenant.status)
      )
        fail("permission-denied", "Cadastro da loja indisponível.");
      return tenant;
    };
    const current = (state, tenant) =>
      state?.verified?.walletId === tenant.asaasWalletId &&
      state.verified.environment === environment &&
      state.verified.binding === companyBinding(tenant);
    if (action === "status")
      return db.runTransaction(async (tx) => {
        const tenant = owner((await tx.get(ref)).data()),
          state = (await tx.get(privateRef)).data();
        return {
          environment,
          verified: Boolean(current(state, tenant)),
          ...(current(state, tenant)
            ? {
                holder: state.verified.holder,
                verifiedAt: state.verified.verifiedAt,
              }
            : {}),
        };
      });
    if (action === "confirm")
      return db.runTransaction(async (tx) => {
        const tenant = owner((await tx.get(ref)).data()),
          state = (await tx.get(privateRef)).data() || {},
          proof = state.proof;
        if (typeof data.proofId !== "string" || data.confirmed !== true)
          fail("invalid-argument", "Confirme os dados do titular.");
        if (state.verified?.proofId === data.proofId && current(state, tenant))
          return { saved: true };
        if (
          !proof ||
          proof.id !== data.proofId ||
          proof.expiresAt <= now() ||
          proof.environment !== environment ||
          proof.binding !== companyBinding(tenant) ||
          proof.previousWallet !== (tenant.asaasWalletId || "")
        )
          fail(
            "failed-precondition",
            "Validação expirada ou cadastro alterado. Valide a conta novamente.",
          );
        if (
          tenant.status === "active" &&
          tenant.asaasWalletId !== proof.walletId
        )
          fail(
            "failed-precondition",
            "Para alterar a carteira de uma loja ativa, fale com o suporte.",
          );
        const updated = { ...tenant, asaasWalletId: proof.walletId },
          completed = profileComplete(updated);
        tx.update(ref, {
          asaasWalletId: proof.walletId,
          setupCompleted: completed,
          updatedAt: timestamp(),
          ...(tenant.status === "pending" && completed
            ? { status: "configured", configuredAt: timestamp() }
            : {}),
        });
        tx.set(privateRef, {
          ...state,
          proof: null,
          verified: {
            proofId: proof.id,
            walletId: proof.walletId,
            binding: proof.binding,
            environment,
            holder: proof.holder,
            verifiedAt: now(),
          },
        });
        return { saved: true };
      });
    const walletId =
      typeof data.walletId === "string" ? data.walletId.trim() : "";
    const apiKey = typeof data.apiKey === "string" ? data.apiKey.trim() : "";
    if (
      !/^[a-zA-Z0-9_-]{10,100}$/.test(walletId) ||
      !apiKey ||
      apiKey.length > 2048 ||
      /[\r\n]/.test(apiKey)
    )
      fail(
        "invalid-argument",
        "Informe o Wallet ID e uma chave de API válida da própria conta Asaas.",
      );
    const attempt = randomUUID();
    const tenant = await db.runTransaction(async (tx) => {
      const tenant = owner((await tx.get(ref)).data()),
        state = (await tx.get(privateRef)).data() || {};
      if (tenant.status === "active" && walletId !== tenant.asaasWalletId)
        fail(
          "failed-precondition",
          "Para alterar a carteira de uma loja ativa, fale com o suporte.",
        );
      if (
        typeof tenant.hasCnpj !== "boolean" ||
        (tenant.hasCnpj && !validCnpj(tenant.cnpj))
      )
        fail(
          "failed-precondition",
          "Complete os dados de empresa e contato primeiro.",
        );
      if (!tenant.hasCnpj && !validCpf(cleanDocument(data.cpf)))
        fail("invalid-argument", "Informe um CPF válido do titular da conta.");
      const attempts = (state.attempts || []).filter(
        (time) => time > now() - 15 * 60 * 1000,
      );
      if (attempts.length >= 5)
        fail(
          "resource-exhausted",
          "Limite de tentativas atingido. Tente novamente em 15 minutos.",
        );
      tx.set(privateRef, {
        ...state,
        attempts: [...attempts, now()],
        attempt,
        proof: null,
      });
      return tenant;
    });
    const base =
      environment === "production"
        ? "https://api.asaas.com/v3"
        : "https://api-sandbox.asaas.com/v3";
    const get = async (path) => {
      try {
        const response = await fetchImpl(base + path, {
          method: "GET",
          redirect: "error",
          headers: {
            access_token: apiKey,
            "User-Agent": "Cardap Account Verification",
            Accept: "application/json",
          },
          signal: AbortSignal.timeout(10000),
        });
        if ([401, 403].includes(response.status))
          fail(
            "failed-precondition",
            "Chave recusada pelo Asaas. Confira a chave e o ambiente da conta.",
          );
        if (!response.ok)
          fail(
            "unavailable",
            "O Asaas não confirmou a consulta. Tente novamente mais tarde.",
          );
        return await response.json();
      } catch (error) {
        if (error instanceof HttpsError) throw error;
        fail(
          "unavailable",
          "Não foi possível consultar o Asaas. Tente novamente.",
        );
      }
    };
    const wallets = await get("/wallets/");
    if (
      !Array.isArray(wallets?.data) ||
      !wallets.data.some((wallet) => wallet.id === walletId)
    )
      fail(
        "failed-precondition",
        "O Wallet ID não pertence à conta da chave informada.",
      );
    const info = await get("/myAccount/commercialInfo/");
    const expected = cleanDocument(tenant.hasCnpj ? tenant.cnpj : data.cpf);
    if (
      cleanDocument(info?.cpfCnpj) !== expected ||
      info.personType !== (tenant.hasCnpj ? "JURIDICA" : "FISICA")
    )
      fail(
        "failed-precondition",
        "O documento do titular no Asaas não corresponde ao documento informado para a loja.",
      );
    const name = tenant.hasCnpj ? info.companyName || info.name : info.name;
    if (
      typeof name !== "string" ||
      !name.trim() ||
      name.length > 200 ||
      ![
        "APPROVED",
        "PENDING",
        "DENIED",
        "AWAITING_ACTION_AUTHORIZATION",
      ].includes(info.status)
    )
      fail("unavailable", "Dados do titular incompletos no Asaas.");
    if (info.status !== "APPROVED")
      fail(
        "failed-precondition",
        "Os dados comerciais da conta ainda não estão aprovados no Asaas.",
      );
    const holder = {
      name: name.trim(),
      document: `${tenant.hasCnpj ? "CNPJ" : "CPF"} •••••${expected.slice(-4)}`,
      personType: info.personType,
    };
    const proof = {
      id: randomUUID(),
      walletId,
      holder,
      binding: companyBinding(tenant),
      previousWallet: tenant.asaasWalletId || "",
      environment,
      expiresAt: now() + 10 * 60 * 1000,
    };
    await db.runTransaction(async (tx) => {
      const latest = owner((await tx.get(ref)).data()),
        state = (await tx.get(privateRef)).data();
      if (
        state?.attempt !== attempt ||
        companyBinding(latest) !== proof.binding ||
        (latest.asaasWalletId || "") !== proof.previousWallet
      )
        fail(
          "failed-precondition",
          "Cadastro alterado durante a consulta. Valide novamente.",
        );
      tx.set(privateRef, { ...state, proof });
    });
    return {
      environment,
      proofId: proof.id,
      holder,
      expiresAt: proof.expiresAt,
    };
  };
}
module.exports = { createAsaasAccountHandler, validCpf };
