export type BillingCycle = "monthly" | "yearly";
export type PreviewPlanId = "essential" | "professional" | "complete";
export const previewPlans = [
  {
    id: "essential",
    name: "Essencial",
    description: "Para começar a organizar sua loja.",
    monthlyCents: 5990,
    yearlyCents: 59900,
    features: [
      "Até 50 produtos no cardápio",
      "Até 2 funcionários",
      "Gestão de pedidos e entregas",
      "Suporte por e-mail",
    ],
  },
  {
    id: "professional",
    name: "Profissional",
    description: "Para acompanhar o crescimento da operação.",
    monthlyCents: 9990,
    yearlyCents: 99900,
    features: [
      "Até 200 produtos no cardápio",
      "Até 10 funcionários",
      "Até 5 entregadores",
      "Relatórios gerenciais",
    ],
  },
  {
    id: "complete",
    name: "Completo",
    description: "Para operações com uma equipe maior.",
    monthlyCents: 14990,
    yearlyCents: 149900,
    features: [
      "Produtos sem limite",
      "Até 30 funcionários",
      "Entregadores sem limite",
      "Suporte prioritário",
    ],
  },
] as const;
export type PlanPreview = { planId: PreviewPlanId; billingCycle: BillingCycle };
export const defaultPlanPreview: PlanPreview = {
  planId: "professional",
  billingCycle: "monthly",
};
export function parsePlanPreview(value: unknown): PlanPreview {
  if (!value || typeof value !== "object") return { ...defaultPlanPreview };
  const input = value as Partial<PlanPreview>;
  return {
    planId: previewPlans.some((plan) => plan.id === input.planId)
      ? input.planId!
      : defaultPlanPreview.planId,
    billingCycle: input.billingCycle === "yearly" ? "yearly" : "monthly",
  };
}
export const formatPlanPrice = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    cents / 100,
  );
