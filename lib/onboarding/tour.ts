import type { StoreOperations } from "@/lib/operations";

export const TOUR_EVENT = "cardap:restart-tour";
export const tourStorageKey = (storeId: string) => `cardap:tour:v1:${storeId}`;

export function tourSteps(operations: StoreOperations) {
  return [
    {
      target: "settings",
      title: "Prepare sua loja",
      description:
        "Em Configurações, complete os dados do restaurante, defina como sua loja opera e cadastre os funcionários.",
    },
    {
      target: "menu",
      title: "Monte seu cardápio",
      description:
        "Cadastre categorias e produtos com preços, fotos e complementos. Depois, confira o que está disponível para seus clientes.",
    },
    {
      target: "orders",
      title: "Acompanhe os pedidos",
      description:
        "Aqui chegam os pedidos da loja. Confira os detalhes e atualize cada etapa do atendimento.",
    },
    ...(operations.salon
      ? [
          {
            target: "salon",
            title: "Cuide do salão",
            description:
              "Acompanhe as mesas, as contas e os pedidos feitos pelos garçons. Os acessos da equipe ficam em Configurações → Funcionários.",
          },
        ]
      : []),
    ...(operations.ownDelivery
      ? [
          {
            target: "deliveries",
            title: "Organize as entregas",
            description:
              "Acompanhe os pedidos para entrega e a distribuição entre os entregadores. Cadastre a equipe em Configurações → Funcionários.",
          },
        ]
      : []),
  ];
}

export function tourCardPosition(
  target: { top: number; bottom: number; left: number; right: number },
  viewport: { width: number; height: number },
  card: { width: number; height: number },
) {
  const margin = 16;
  const gap = 16;
  const maxLeft = Math.max(margin, viewport.width - card.width - margin);
  const maxTop = Math.max(margin, viewport.height - card.height - margin);
  const fitsRight = target.right + gap + card.width <= viewport.width - margin;
  const fitsBelow =
    target.bottom + gap + card.height <= viewport.height - margin;
  const left = fitsRight ? target.right + gap : target.left;
  const top = fitsRight
    ? target.top
    : fitsBelow
      ? target.bottom + gap
      : target.top - gap - card.height;
  return {
    left: Math.min(maxLeft, Math.max(margin, left)),
    top: Math.min(maxTop, Math.max(margin, top)),
  };
}
