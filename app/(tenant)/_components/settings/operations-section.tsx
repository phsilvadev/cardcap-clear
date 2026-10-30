"use client";
import SuccessAlert from "../feedback/success-alert";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { httpsCallable } from "firebase/functions";
import { getFirebaseFunctions } from "@/lib/firebase/client";
import { useStoreOperations } from "../dashboard/operations-provider";
import type { StoreOperations } from "@/lib/operations";
export default function OperationsSection({ storeId }: { storeId?: string }) {
  const { operations, ready, error: loadError } = useStoreOperations();
  const [draft, setDraft] = useState(operations);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const locked = useRef(false);
  useEffect(() => {
    setDraft(operations);
  }, [operations]);
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!ready || !storeId || locked.current) return;
    locked.current = true;
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await httpsCallable<
        { storeId: string } & StoreOperations,
        { operations: StoreOperations }
      >(
        getFirebaseFunctions(),
        "tenantSetOperations",
      )({ storeId, ...draft });
      setMessage("Operação salva. O menu da loja foi atualizado.");
    } catch {
      setError(
        "Não foi possível salvar. Confira sua conexão e o acesso do proprietário e tente novamente.",
      );
    } finally {
      locked.current = false;
      setSaving(false);
    }
  }
  return (
    <form className="operations-form" onSubmit={save}>
      <div className="operations-options">
        {(
          [
            {
              key: "salon",
              title: "Atendimento no salão",
              description:
                "Habilite a seção Garçons para acompanhar a equipe que utiliza o app do garçom.",
            },
            {
              key: "ownDelivery",
              title: "Entrega própria",
              description:
                "Habilite a seção Entregadores para gerenciar os motoboys do restaurante.",
            },
          ] as const
        ).map((item) => (
          <label className="operations-option" key={item.key}>
            <div>
              <strong>{item.title}</strong>
              <p>{item.description}</p>
              <span>{draft[item.key] ? "Habilitado" : "Desabilitado"}</span>
            </div>
            <input
              type="checkbox"
              role="switch"
              aria-label={item.title}
              checked={draft[item.key]}
              disabled={!ready || saving}
              onChange={(event) => {
                setDraft((current) => ({
                  ...current,
                  [item.key]: event.target.checked,
                }));
                setMessage("");
              }}
            />
          </label>
        ))}
      </div>
      <p className="operations-note">
        Cadastre a equipe e libere o acesso aos apps em Funcionários.
        Desabilitar uma seção mantém os cadastros e os acessos existentes.
      </p>
      {(error || loadError) && <p role="alert">{error || loadError}</p>}
      <SuccessAlert
        open={Boolean(message)}
        title="Operação salva!"
        description="O menu da loja foi atualizado com as opções escolhidas."
        onClose={() => setMessage("")}
      />
      <button
        className="button primary"
        type="submit"
        disabled={!ready || saving}
      >
        {saving ? "Salvando…" : "Salvar operação"}
      </button>
    </form>
  );
}
