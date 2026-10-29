"use client";
import Dialog from "@/app/(tenant)/_components/products/product-dialog";
import { useStoreReadiness } from "@/app/(tenant)/_hooks/use-store-readiness";
export default function StoreReadinessCard({ storeId }: { storeId?: string }) {
  const control = useStoreReadiness(storeId);
  if (
    !storeId ||
    (control.data &&
      control.data.completed === control.data.total &&
      !control.error &&
      !control.loading &&
      !control.open)
  )
    return null;
  return (
    <>
      <button
        type="button"
        className="store-readiness-card"
        onClick={control.show}
        aria-haspopup="dialog"
      >
        <span className="store-readiness-icon" aria-hidden="true">
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 5H5v16h14V5h-4M9 3h6v4H9zM8 12l2 2 5-5M8 17h8" />
          </svg>
        </span>
        <span className="store-readiness-copy">
          <strong>
            {control.awaitingActivation
              ? "Sua loja está aguardando ativação"
              : "Finalize sua loja para aparecer na plataforma"}
          </strong>
          <span>
            {control.loading
              ? "Verificando as etapas do seu cadastro…"
              : control.error
                ? "Confira o cadastro e tente verificar novamente."
                : `${control.data?.completed ?? 0} de ${control.data?.total ?? 0} etapas concluídas. Veja o que falta para preparar sua loja.`}
          </span>
        </span>
        <span className="store-readiness-cta">
          Ver checklist <span aria-hidden="true">→</span>
        </span>
      </button>
      <Dialog
        id="store-readiness-dialog"
        title="Prepare sua loja para a plataforma"
        open={control.open}
        onClose={control.close}
      >
        <p className="store-readiness-note">
          Este checklist considera os dados salvos da loja. Prévias locais das
          configurações não concluem as etapas. A ativação depende da liberação
          da plataforma.
        </p>
        {control.loading ? (
          <div className="store-readiness-loading" role="status">
            <span className="sr-only">Verificando cadastro…</span>
            {[0, 1, 2].map((value) => (
              <div
                className="menu-skeleton-block"
                key={value}
                aria-hidden="true"
              />
            ))}
          </div>
        ) : control.error ? (
          <p role="alert">{control.error}</p>
        ) : control.data ? (
          <>
            <div className="store-readiness-progress">
              <strong>
                {control.data.completed} de {control.data.total} etapas
                concluídas
              </strong>
              <progress
                max={control.data.total}
                value={control.data.completed}
                aria-label="Progresso do cadastro"
              />
            </div>
            <ol className="store-readiness-list">
              {control.data.items.map((item) => (
                <li key={item.id} data-complete={item.complete}>
                  <span className="store-readiness-check" aria-hidden="true">
                    {item.complete ? "✓" : "○"}
                  </span>
                  <div>
                    <div className="store-readiness-item-title">
                      <h3>{item.title}</h3>
                      <span>{item.complete ? "Concluído" : "Pendente"}</span>
                    </div>
                    {!item.complete && <p>{item.missing.join("; ")}.</p>}
                    {!item.complete && item.href && (
                      <a href={item.href}>
                        {item.action} <span aria-hidden="true">→</span>
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </>
        ) : null}
        <div className="dialog-actions">
          <button
            type="button"
            className="button secondary"
            disabled={control.loading}
            onClick={control.refresh}
          >
            {control.loading ? "Verificando…" : "Verificar novamente"}
          </button>
          <button
            type="button"
            className="button primary"
            onClick={control.close}
          >
            Fechar checklist
          </button>
        </div>
      </Dialog>
    </>
  );
}
