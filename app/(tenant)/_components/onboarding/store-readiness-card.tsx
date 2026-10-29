"use client";
import Dialog from "@/app/(tenant)/_components/products/product-dialog";
import type { ReadinessItem } from "@/lib/onboarding/readiness";
import { useStoreReadiness } from "@/app/(tenant)/_hooks/use-store-readiness";
function ChecklistItems({ items }: { items: ReadinessItem[] }) {
  return (
    <ol className="store-readiness-list">
      {items.map((item) => (
        <li key={item.id} data-complete={item.complete}>
          <span className="store-readiness-check" aria-hidden="true">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={
                item.complete ? "lucide lucide-check" : "lucide lucide-clock"
              }
              focusable="false"
            >
              {item.complete ? (
                <path d="M20 6 9 17l-5-5" />
              ) : (
                <>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </>
              )}
            </svg>
          </span>
          <div>
            <div className="store-readiness-item-title">
              <h4>{item.title}</h4>
              {!item.complete && <span>Pendente</span>}
            </div>
            {!item.complete && (
              <ul className="store-readiness-missing">
                {item.missing.map((missing) => (
                  <li key={missing}>{missing}</li>
                ))}
              </ul>
            )}
            {!item.complete && item.href && (
              <a href={item.href}>
                {item.action} <span aria-hidden="true">→</span>
              </a>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

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
            <path d="m2 7 2-4h16l2 4" />
            <path d="M2 7v3a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0V7Z" />
            <path d="M4 13v8h16v-8M9 21v-7h6v7" />
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
          Etapas conferidas no cadastro salvo da loja. Prévias locais não
          concluem o cadastro.
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
            {control.data.completed < control.data.total ? (
              <section
                className="store-readiness-pending"
                aria-labelledby="readiness-pending-title"
              >
                <h3 id="readiness-pending-title">
                  O que falta{" "}
                  <span>{control.data.total - control.data.completed}</span>
                </h3>
                <ChecklistItems
                  items={control.data.items.filter((item) => !item.complete)}
                />
              </section>
            ) : (
              <p className="store-readiness-success">
                Todas as etapas foram concluídas.
              </p>
            )}
            {control.data.completed > 0 && (
              <details className="store-readiness-completed">
                <summary>
                  <span>Etapas concluídas ({control.data.completed})</span>
                </summary>
                <ChecklistItems
                  items={control.data.items.filter((item) => item.complete)}
                />
              </details>
            )}
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
