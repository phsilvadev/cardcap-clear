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
  "MG",
  "MS",
  "MT",
  "PA",
  "PB",
  "PE",
  "PI",
  "PR",
  "RJ",
  "RN",
  "RO",
  "RR",
  "RS",
  "SC",
  "SE",
  "SP",
  "TO",
];
const fields = {
  details: ["name", "description", "category"],
  company: [
    "ownerName",
    "phone",
    "whatsapp",
    "contactEmail",
    "hasCnpj",
    "cnpj",
    "legalName",
  ],
  address: [
    "postalCode",
    "street",
    "number",
    "complement",
    "district",
    "city",
    "state",
  ],
  hours: ["openingDay", "closingDay", "openingTime", "closingTime"],
  delivery: ["acceptsDelivery", "acceptsPickup", "deliveryTime", "deliveryFee"],
  wallet: ["asaasWalletId"],
};
const sized = (value, min, max) =>
  typeof value === "string" &&
  value.trim().length >= min &&
  value.length <= max;
function validCnpj(value) {
  if (typeof value !== "string") return false;
  const code = value.toUpperCase().replace(/[.\s/-]/g, "");
  if (!/^[A-Z0-9]{12}[0-9]{2}$/.test(code) || /^(.)\1+$/.test(code))
    return false;
  const digit = (part) => {
    let weight = 2;
    let sum = 0;
    for (let i = part.length - 1; i >= 0; i--) {
      sum += (part.charCodeAt(i) - 48) * weight;
      weight = weight === 9 ? 2 : weight + 1;
    }
    const remainder = sum % 11;
    return remainder < 2 ? "0" : String(11 - remainder);
  };
  return (
    digit(code.slice(0, 12)) === code[12] &&
    digit(code.slice(0, 13)) === code[13]
  );
}
function sectionIssues(section, data) {
  const issues = [];
  const require = (ok, label) => {
    if (!ok) issues.push(label);
  };
  if (section === "details") {
    require(sized(data.name, 3, 80), "nome da loja");
    require(sized(
      data.description,
      20,
      300,
    ), "descrição com 20 a 300 caracteres");
    require(categories.includes(data.category), "categoria do restaurante");
  } else if (section === "company") {
    require(sized(data.ownerName, 3, 100), "nome do responsável");
    require(typeof data.phone === "string" &&
      /^\d{10,11}$/.test(data.phone), "telefone com DDD");
    require(sized(data.contactEmail, 5, 254) &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        data.contactEmail,
      ), "e-mail de contato");
    require(!data.whatsapp ||
      /^\d{10,11}$/.test(data.whatsapp), "WhatsApp com DDD");
    const has =
      typeof data.hasCnpj === "boolean"
        ? data.hasCnpj
        : validCnpj(data.cnpj)
          ? true
          : undefined;
    require(typeof has === "boolean", "informar se a loja tem CNPJ");
    if (has === true) {
      require(validCnpj(data.cnpj), "CNPJ válido");
      require(sized(data.legalName, 2, 120), "razão social");
    }
  } else if (section === "address") {
    require(/^\d{8}$/.test(data.postalCode || ""), "CEP");
    for (const [name, min, max, label] of [
      ["street", 3, 120, "rua ou avenida"],
      ["number", 1, 12, "número"],
      ["district", 2, 60, "bairro"],
      ["city", 2, 60, "cidade"],
    ])
      require(sized(data[name], min, max), label);
    require(typeof data.complement === "string" &&
      data.complement.length <= 100, "complemento com até 100 caracteres");
    require(states.includes(data.state), "UF");
  } else if (section === "hours") {
    require(days.includes(data.openingDay) &&
      days.includes(data.closingDay), "dias de atendimento");
    require(/^([01]\d|2[0-3]):[0-5]\d$/.test(data.openingTime || "") &&
      /^([01]\d|2[0-3]):[0-5]\d$/.test(data.closingTime || "") &&
      data.openingTime !==
        data.closingTime, "horários de abertura e fechamento");
  } else if (section === "delivery") {
    require(typeof data.acceptsDelivery === "boolean" &&
      typeof data.acceptsPickup ===
        "boolean", "modalidades de atendimento válidas");
    require(data.acceptsDelivery === true ||
      data.acceptsPickup === true, "uma modalidade de atendimento");
    if (data.acceptsDelivery === true) {
      require(sized(data.deliveryTime, 1, 30), "prazo estimado de entrega");
      require(Number.isInteger(data.deliveryFeeCents) &&
        data.deliveryFeeCents >= 0 &&
        data.deliveryFeeCents <=
          99900, "taxa de entrega válida (pode ser zero)");
    }
  } else if (section === "wallet")
    require(typeof data.asaasWalletId === "string" &&
      /^[a-zA-Z0-9_-]{10,100}$/.test(
        data.asaasWalletId,
      ), "Wallet ID salvo no cadastro");
  else issues.push("seção inválida");
  return issues;
}
function normalizeSection(section, input) {
  if (
    !Object.hasOwn(fields, section) ||
    !input ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    Object.keys(input).some((key) => !fields[section].includes(key))
  )
    return { values: {}, issues: ["campos inválidos para esta seção"] };
  const values = {};
  for (const key of fields[section]) {
    if (["hasCnpj", "acceptsDelivery", "acceptsPickup"].includes(key)) {
      values[key] = input[key];
      continue;
    }
    if (input[key] !== undefined && typeof input[key] !== "string")
      return { values: {}, issues: ["formato inválido dos campos"] };
    values[key] = (input[key] || "").trim();
  }
  if (section === "company") {
    values.phone = values.phone.replace(/\D/g, "");
    values.whatsapp = values.whatsapp.replace(/\D/g, "");
    values.contactEmail = values.contactEmail.toLowerCase();
    values.cnpj = values.cnpj.toUpperCase().replace(/[.\s/-]/g, "");
    if (values.hasCnpj === false) {
      values.cnpj = "";
      values.legalName = "";
    }
  }
  if (section === "address") {
    values.postalCode = values.postalCode.replace(/\D/g, "");
    values.state = values.state.toUpperCase();
  }
  if (section === "delivery") {
    const text = values.deliveryFee.replace(",", ".");
    values.deliveryFeeCents = /^\d{1,3}(\.\d{1,2})?$/.test(text)
      ? Math.round(Number(text) * 100)
      : null;
    delete values.deliveryFee;
    if (values.acceptsDelivery === false) {
      values.deliveryTime = "";
      values.deliveryFeeCents = 0;
    }
  }
  return { values, issues: sectionIssues(section, values) };
}
function profileComplete(data) {
  return Object.keys(fields).every(
    (section) =>
      sectionIssues(section, { complement: "", ...data }).length === 0,
  );
}
module.exports = {
  fields,
  normalizeSection,
  sectionIssues,
  profileComplete,
  validCnpj,
};
