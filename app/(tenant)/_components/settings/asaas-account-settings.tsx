"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { httpsCallable } from "firebase/functions";
import { getFirebaseFunctions } from "@/lib/firebase/client";
import { useStoreSettings } from "./store-settings-provider";
import AsaasSetupGuide from "./asaas-setup-guide";

type Result = {
  environment: "sandbox" | "production";
  verified?: boolean;
  proofId?: string;
  expiresAt?: number;
  holder?: { name: string; document: string; personType: string };
};
export default function AsaasAccountSettings({
  storeId,
  enabled,
}: {
  storeId?: string;
  enabled: boolean;
}) {
  const { data, loading, error: storeError } = useStoreSettings();
  const [wallet, setWallet] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [cpf, setCpf] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const scope = useRef(0);
  const company = JSON.stringify([
    data?.ownerUid,
    data?.hasCnpj,
    data?.cnpj,
    data?.ownerName,
    data?.legalName,
    data?.asaasWalletId,
  ]);
  useEffect(() => {
    const version = ++scope.current;
    setWallet(String(data?.asaasWalletId || ""));
    setApiKey("");
    setCpf("");
    setResult(null);
    setConfirmed(false);
    setError("");
    setSuccess(false);
    if (!enabled || !storeId || !data) return;
    httpsCallable(
      getFirebaseFunctions(),
      "tenantValidateAsaasAccount",
    )({ storeId, action: "status" })
      .then((response) => {
        if (scope.current === version) setResult(response.data as Result);
      })
      .catch(() => {
        if (scope.current === version)
          setError(
            "Não foi possível consultar a validação. Tente reabrir esta seção.",
          );
      });
    return () => {
      scope.current++;
    };
    // The signature tracks precisely the fields that invalidate a validation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, enabled, company]);
  function change() {
    scope.current++;
    setResult((value) => (value ? { environment: value.environment } : null));
    setConfirmed(false);
    setSuccess(false);
    setError("");
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!storeId || busy) return;
    const version = scope.current;
    const proof = result?.proofId;
    if (
      proof &&
      (!confirmed || !result.expiresAt || result.expiresAt <= Date.now())
    ) {
      setError("Confirme o titular ou valide novamente se a consulta expirou.");
      return;
    }
    setBusy(true);
    setError("");
    setSuccess(false);
    const request = proof
      ? { storeId, action: "confirm", proofId: proof, confirmed: true }
      : { storeId, action: "validate", walletId: wallet, apiKey, cpf };
    setApiKey("");
    try {
      const response = await httpsCallable(
        getFirebaseFunctions(),
        "tenantValidateAsaasAccount",
      )(request);
      if (version !== scope.current) return;
      if (proof) {
        setSuccess(true);
        setResult((value) =>
          value ? { ...value, proofId: undefined, verified: true } : null,
        );
        setCpf("");
      } else {
        setResult(response.data as Result);
        setConfirmed(false);
      }
    } catch (cause) {
      if (version !== scope.current) return;
      const failure = cause as { code?: string; message?: string };
      setError(
        [
          "functions/failed-precondition",
          "functions/invalid-argument",
          "functions/resource-exhausted",
          "functions/unavailable",
        ].includes(failure.code || "")
          ? failure.message || "Não foi possível validar a conta."
          : "Não foi possível validar. Confira sua sessão e tente novamente.",
      );
    } finally {
      setBusy(false);
    }
  }
  const canEdit = Boolean(
    storeId &&
    data &&
    ["pending", "configured", "active"].includes(String(data.status)),
  );
  return (
    <form className="store-settings-form" onSubmit={submit}>
      <AsaasSetupGuide />
      <p className="settings-section-note">
        Valide sua conta Asaas independente para confirmar quem receberá os
        repasses. A chave é usada apenas nesta consulta e não fica salva no
        Cardap.
      </p>
      {result && (
        <p className="settings-section-note">
          Ambiente:{" "}
          {result.environment === "production"
            ? "Produção"
            : "Sandbox — conta de testes"}
          .{" "}
          {result.verified
            ? "Carteira e titular conferidos."
            : "Conta ainda não validada para este cadastro."}
        </p>
      )}
      <fieldset
        className="store-settings-fields"
        disabled={loading || busy || !canEdit}
      >
        <div className="settings-fields-grid">
          <label className="flow-field">
            Wallet ID da sua conta Asaas
            <input
              required
              maxLength={100}
              value={wallet}
              readOnly={data?.status === "active"}
              onChange={(event) => {
                setWallet(event.target.value);
                change();
              }}
            />
          </label>
          {!result?.proofId && (
            <label className="flow-field">
              Chave de API da mesma conta
              <input
                type="password"
                autoComplete="off"
                spellCheck={false}
                required
                maxLength={2048}
                value={apiKey}
                onChange={(event) => {
                  setApiKey(event.target.value);
                  change();
                }}
              />
            </label>
          )}
          {data?.hasCnpj === false && !result?.proofId && (
            <label className="flow-field">
              CPF do titular da conta
              <input
                required
                inputMode="numeric"
                autoComplete="off"
                maxLength={14}
                value={cpf}
                onChange={(event) => {
                  setCpf(event.target.value);
                  change();
                }}
              />
              <small>
                Conferido com o CPF no Asaas; não representa uma verificação de
                identidade do responsável.
              </small>
            </label>
          )}
        </div>
        {data?.hasCnpj === true && (
          <p className="settings-section-note">
            O CNPJ da conta deve ser igual ao cadastrado em Empresa e contato.
          </p>
        )}
        {result?.holder && (
          <div className="settings-section-note" aria-live="polite">
            <strong>{result.holder.name}</strong>
            <p>{result.holder.document}</p>
            <p>
              {result.environment === "sandbox"
                ? "Dados consultados na conta de testes."
                : "Dados consultados na conta Asaas."}
            </p>
          </div>
        )}
        {result?.proofId && (
          <>
            <label>
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
                required
              />{" "}
              Confirmo que esta é a conta correta para os repasses do
              restaurante.
            </label>
            <p className="settings-section-note">
              Esta confirmação é válida por 10 minutos.
            </p>
          </>
        )}
        <div className="settings-save-row">
          <button
            type="submit"
            className="button primary"
            disabled={Boolean(result?.proofId && !confirmed)}
          >
            {busy
              ? "Consultando…"
              : result?.proofId
                ? "Confirmar conta e salvar"
                : "Validar conta Asaas"}
          </button>
          {result?.proofId && (
            <button className="button" type="button" onClick={change}>
              Corrigir dados
            </button>
          )}
        </div>
      </fieldset>
      {data?.status === "active" && (
        <p className="settings-section-note">
          A carteira da loja ativa pode ser conferida novamente. Para trocar a
          carteira, fale com o suporte.
        </p>
      )}
      <p className="settings-section-note">
        A conferência não ativa vendas nem garante a liberação de pagamentos
        pelo Asaas. Você pode revogar a chave no Asaas após a consulta.
      </p>
      {(error || storeError) && (
        <p className="flow-status" role="alert">
          {error || storeError}
        </p>
      )}
      {success && <p role="status">Conta confirmada e carteira salva.</p>}
    </form>
  );
}
