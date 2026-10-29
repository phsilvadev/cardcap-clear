export type ReadinessItem = {
  id: string;
  title: string;
  complete: boolean;
  missing: string[];
  href?: string;
  action?: string;
};
const days = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo",
];
const categories = [
  "restaurante",
  "lanchonete",
  "pizzaria",
  "cafeteria",
  "padaria",
  "doceria",
  "mercado",
  "outros",
];
const states = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];
const length = (value: unknown, min: number, max: number) =>
  typeof value === "string" &&
  value.trim().length >= min &&
  value.length <= max;
const matches = (value: unknown, pattern: RegExp) =>
  typeof value === "string" && pattern.test(value);
const oneOf = (value: unknown, options: readonly string[]) =>
  typeof value === "string" && options.includes(value);
export function evaluateStoreReadiness(
  data: Record<string, unknown>,
  hasCategory: boolean,
  hasProduct: boolean,
): ReadinessItem[] {
  const items: ReadinessItem[] = [];
  const section = (
    id: string,
    title: string,
    checks: [boolean, string][],
    tab: string,
  ) => {
    const missing = checks
      .filter(([valid]) => !valid)
      .map(([, label]) => label);
    items.push({
      id,
      title,
      complete: missing.length === 0,
      missing,
      href: `/dashboard?view=settings&section=${tab}`,
      action: "Completar dados",
    });
  };
  section(
    "details",
    "Apresentação da loja",
    [
      [length(data.name, 3, 80), "nome da loja"],
      [length(data.description, 20, 300), "descrição com 20 a 300 caracteres"],
      [oneOf(data.category, categories), "categoria do restaurante"],
    ],
    "details",
  );
  section(
    "company",
    "Responsável e contato",
    [
      [length(data.ownerName, 3, 100), "nome do responsável"],
      [matches(data.phone, /^\d{10,11}$/), "telefone com DDD"],
      [
        length(data.contactEmail, 5, 254) &&
          matches(data.contactEmail, /^[^\s@]+@[^\s@]+\.[^\s@]+$/),
        "e-mail de contato",
      ],
    ],
    "company",
  );
  section(
    "address",
    "Endereço da loja",
    [
      [matches(data.postalCode, /^\d{8}$/), "CEP"],
      [length(data.street, 3, 120), "rua ou avenida"],
      [length(data.number, 1, 12), "número"],
      [length(data.district, 2, 60), "bairro"],
      [length(data.city, 2, 60), "cidade"],
      [oneOf(data.state, states), "UF"],
    ],
    "address",
  );
  section(
    "hours",
    "Horários de funcionamento",
    [
      [
        oneOf(data.openingDay, days) && oneOf(data.closingDay, days),
        "dias de atendimento",
      ],
      [
        matches(data.openingTime, /^([01]\d|2[0-3]):[0-5]\d$/) &&
          matches(data.closingTime, /^([01]\d|2[0-3]):[0-5]\d$/) &&
          data.openingTime !== data.closingTime,
        "horários de abertura e fechamento",
      ],
    ],
    "hours",
  );
  const delivers = data.acceptsDelivery === true;
  section(
    "delivery",
    "Entrega ou retirada",
    [
      [
        delivers || data.acceptsPickup === true,
        "uma modalidade de atendimento",
      ],
      [
        !delivers || length(data.deliveryTime, 1, 30),
        "prazo estimado de entrega",
      ],
      [
        !delivers ||
          (typeof data.deliveryFeeCents === "number" &&
            Number.isInteger(data.deliveryFeeCents) &&
            data.deliveryFeeCents >= 0 &&
            data.deliveryFeeCents <= 99900),
        "taxa de entrega válida (pode ser zero)",
      ],
    ],
    "delivery",
  );
  section(
    "wallet",
    "Carteira de recebimento informada",
    [
      [
        matches(data.asaasWalletId, /^[a-zA-Z0-9_-]{10,100}$/),
        "Wallet ID salvo no cadastro",
      ],
    ],
    "wallet",
  );
  items.push({
    id: "categories",
    title: "Categorias do cardápio",
    complete: hasCategory,
    missing: hasCategory ? [] : ["pelo menos uma categoria cadastrada"],
    href: "/dashboard/cardapio",
    action: "Organizar categorias",
  });
  items.push({
    id: "products",
    title: "Produto disponível para venda",
    complete: hasProduct,
    missing: hasProduct
      ? []
      : ["pelo menos um produto disponível, com preço, categoria e foto"],
    href: "/dashboard/cardapio",
    action: "Revisar produtos",
  });
  const setup =
    data.setupCompleted === true &&
    oneOf(data.status, ["configured", "active"]);
  items.push({
    id: "setup",
    title: "Cadastro finalizado",
    complete: setup,
    missing: setup ? [] : ["concluir e salvar a configuração da loja no Anow"],
    href: "/dashboard?view=settings",
    action: "Revisar cadastro",
  });
  items.push({
    id: "activation",
    title: "Ativação na plataforma",
    complete: data.status === "active",
    missing:
      data.status === "active"
        ? []
        : [
            data.status === "suspended"
              ? "a loja está suspensa; entre em contato com a plataforma"
              : "após preparar a loja, aguarde a liberação da plataforma",
          ],
  });
  return items;
}
