export const settingsSections = [
  {
    id: "details",
    label: "Dados da loja",
    description: "Nome e apresentação do restaurante.",
  },
  {
    id: "company",
    label: "Empresa e contato",
    description: "Responsável, dados da empresa e canais de contato.",
  },
  {
    id: "address",
    label: "Endereço",
    description: "Localização e endereço de retirada.",
  },
  {
    id: "hours",
    label: "Horários",
    description: "Dias e horários de funcionamento.",
  },
  {
    id: "delivery",
    label: "Entrega e retirada",
    description: "Modalidades, prazo e taxa de entrega.",
  },
  {
    id: "wallet",
    label: "Recebimentos",
    description: "Carteira Asaas para recebimento de pagamentos.",
  },
  {
    id: "plan",
    label: "Plano e assinatura",
    description: "Plano selecionado, valores e benefícios.",
  },
  {
    id: "employees",
    label: "Funcionários",
    description: "Organização dos acessos da equipe.",
  },
  {
    id: "permissions",
    label: "Permissões",
    description: "Perfis e limites de acesso ao restaurante.",
  },
] as const;
export type SettingsSectionId = (typeof settingsSections)[number]["id"];
export type PreviewSectionId = Exclude<
  SettingsSectionId,
  "details" | "employees" | "permissions" | "plan"
>;
type Field = {
  name: string;
  label: string;
  type?: "text" | "email" | "tel" | "time" | "number" | "checkbox" | "select";
  required?: boolean;
  maxLength?: number;
  placeholder?: string;
  options?: readonly string[];
  min?: number;
  max?: number;
  step?: string;
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
export const previewFields: Record<PreviewSectionId, Field[]> = {
  company: [
    {
      name: "ownerName",
      label: "Nome do responsável",
      maxLength: 100,
      required: true,
    },
    { name: "legalName", label: "Razão social", maxLength: 120 },
    {
      name: "cnpj",
      label: "CNPJ",
      maxLength: 18,
      placeholder: "00.000.000/0000-00",
    },
    {
      name: "whatsapp",
      label: "WhatsApp",
      type: "tel",
      maxLength: 16,
      placeholder: "(11) 99999-9999",
    },
    {
      name: "contactEmail",
      label: "E-mail de contato",
      type: "email",
      maxLength: 254,
    },
  ],
  address: [
    {
      name: "postalCode",
      label: "CEP",
      required: true,
      maxLength: 9,
      placeholder: "00000-000",
    },
    { name: "street", label: "Rua ou avenida", required: true, maxLength: 120 },
    { name: "number", label: "Número", required: true, maxLength: 12 },
    { name: "complement", label: "Complemento", maxLength: 100 },
    { name: "district", label: "Bairro", required: true, maxLength: 60 },
    { name: "city", label: "Cidade", required: true, maxLength: 60 },
    {
      name: "state",
      label: "UF",
      type: "select",
      required: true,
      options: [
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
      ],
    },
  ],
  hours: [
    {
      name: "openingDay",
      label: "Do dia",
      type: "select",
      options: days,
      required: true,
    },
    {
      name: "closingDay",
      label: "Até o dia",
      type: "select",
      options: days,
      required: true,
    },
    { name: "openingTime", label: "Abre às", type: "time", required: true },
    { name: "closingTime", label: "Fecha às", type: "time", required: true },
  ],
  delivery: [
    { name: "acceptsDelivery", label: "Aceitar entrega", type: "checkbox" },
    {
      name: "acceptsPickup",
      label: "Aceitar retirada na loja",
      type: "checkbox",
    },
    {
      name: "deliveryTime",
      label: "Tempo estimado",
      maxLength: 30,
      placeholder: "Ex.: 30–45 min",
    },
    {
      name: "deliveryFee",
      label: "Taxa de entrega (R$)",
      type: "number",
      min: 0,
      max: 999,
      step: "0.01",
      placeholder: "0,00",
    },
  ],
  wallet: [
    {
      name: "asaasWalletId",
      label: "Wallet ID da carteira Asaas",
      maxLength: 100,
      placeholder: "Identificador da carteira de recebimento",
    },
  ],
};
