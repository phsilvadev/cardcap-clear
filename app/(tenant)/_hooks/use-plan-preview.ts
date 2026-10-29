"use client";
import { useEffect, useState } from "react";
import {
  defaultPlanPreview,
  parsePlanPreview,
  previewPlans,
  type PlanPreview,
  type PreviewPlanId,
  type BillingCycle,
} from "@/lib/plans/catalog";

export function usePlanPreview(tenantSlug: string, enabled: boolean) {
  const [selection, setSelection] = useState<PlanPreview>({
    ...defaultPlanPreview,
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const key = `cardap-demo-subscription:${tenantSlug}`;
  useEffect(() => {
    if (!enabled) return;
    setLoading(true);
    setError("");
    setMessage("");
    try {
      setSelection(
        parsePlanPreview(JSON.parse(sessionStorage.getItem(key) ?? "null")),
      );
    } catch {
      setSelection({ ...defaultPlanPreview });
      setError(
        "Não foi possível carregar a prévia salva. Exibindo o plano de exemplo.",
      );
    }
    setLoading(false);
  }, [key, enabled]);
  const save = (next: PlanPreview, notice: string) => {
    try {
      sessionStorage.setItem(key, JSON.stringify(next));
      setSelection(next);
      setError("");
      setMessage(notice);
    } catch {
      setError(
        "Não foi possível salvar a seleção neste navegador. O plano anterior foi mantido.",
      );
    }
  };
  const selectPlan = (planId: PreviewPlanId) => {
    const plan = previewPlans.find((item) => item.id === planId);
    if (plan)
      save(
        { ...selection, planId },
        `Plano ${plan.name} selecionado na prévia. Nenhuma cobrança foi criada.`,
      );
  };
  const setBillingCycle = (billingCycle: BillingCycle) =>
    save(
      { ...selection, billingCycle },
      `Ciclo ${billingCycle === "monthly" ? "mensal" : "anual"} selecionado na prévia.`,
    );
  const current = previewPlans.find((plan) => plan.id === selection.planId)!;
  return {
    selection,
    current,
    loading,
    message,
    error,
    selectPlan,
    setBillingCycle,
  };
}
