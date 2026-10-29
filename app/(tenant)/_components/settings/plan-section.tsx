"use client";
import { usePlanPreview } from "@/app/(tenant)/_hooks/use-plan-preview";
import { previewPlans, formatPlanPrice } from "@/lib/plans/catalog";
export default function PlanSection({
  tenantSlug,
  enabled,
}: {
  tenantSlug: string;
  enabled: boolean;
}) {
  const control = usePlanPreview(tenantSlug, enabled);
  if (control.loading)
    return (
      <div className="plan-loading" role="status">
        <span className="sr-only">Carregando plano…</span>
        <div className="menu-skeleton-block" />
        <div className="menu-skeleton-block" />
      </div>
    );
  const yearly = control.selection.billingCycle === "yearly";
  const price = (plan: (typeof previewPlans)[number]) =>
    formatPlanPrice(yearly ? plan.yearlyCents : plan.monthlyCents);
  return (
    <div className="plan-section">
      <p className="plan-preview-note">
        Planos fictícios para visualização. Selecionar uma opção não contrata
        serviços, não gera cobrança e não altera as permissões da loja.
      </p>
      <div className="plan-current">
        <div>
          <span className="plan-eyebrow">Plano selecionado na prévia</span>
          <h3>{control.current.name}</h3>
          <p>{control.current.description}</p>
        </div>
        <div className="plan-current-price">
          <strong>{price(control.current)}</strong>
          <span>{yearly ? "por ano" : "por mês"}</span>
        </div>
      </div>
      <dl className="plan-details">
        <div>
          <dt>Ciclo da prévia</dt>
          <dd>{yearly ? "Anual" : "Mensal"}</dd>
        </div>
        <div>
          <dt>Situação</dt>
          <dd>Exemplo de assinatura</dd>
        </div>
        <div>
          <dt>Próxima cobrança</dt>
          <dd>Não se aplica à prévia</dd>
        </div>
      </dl>
      <div className="plan-comparison-heading">
        <div>
          <h3>Compare os planos</h3>
          <p>Escolha uma opção para visualizar como ela ficará na sua loja.</p>
        </div>
        <div
          className="plan-cycle"
          role="group"
          aria-label="Ciclo de cobrança da prévia"
        >
          <button
            type="button"
            aria-pressed={!yearly}
            onClick={() => control.setBillingCycle("monthly")}
          >
            Mensal
          </button>
          <button
            type="button"
            aria-pressed={yearly}
            onClick={() => control.setBillingCycle("yearly")}
          >
            Anual
          </button>
        </div>
      </div>
      <p className="plan-message" role="status" aria-live="polite">
        {control.message}
      </p>
      {control.error && (
        <p className="employees-error" role="alert">
          {control.error}
        </p>
      )}
      <div className="plan-options">
        {previewPlans.map((plan) => {
          const selected = control.selection.planId === plan.id;
          return (
            <article
              key={plan.id}
              className="plan-option"
              data-selected={selected}
              aria-label={`Plano ${plan.name}`}
            >
              <div className="plan-option-title">
                <h4>{plan.name}</h4>
                {selected && <span>Selecionado</span>}
              </div>
              <p className="plan-option-description">{plan.description}</p>
              <p className="plan-option-price">
                <strong>{price(plan)}</strong>
                <span>/{yearly ? "ano" : "mês"}</span>
              </p>
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <span aria-hidden="true">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className={`button ${selected ? "primary" : "secondary"}`}
                disabled={selected}
                onClick={() => control.selectPlan(plan.id)}
              >
                {selected ? "Plano da prévia" : "Selecionar na prévia"}
              </button>
            </article>
          );
        })}
      </div>
      <p className="plan-footer-note">
        Os valores, benefícios e limites acima são exemplos. Os dados de uma
        assinatura real aparecerão quando a contratação estiver integrada.
      </p>
    </div>
  );
}
