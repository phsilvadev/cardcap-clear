import type { ProductCustomization } from "@/lib/menu/types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const hasKeys = (value: Record<string, unknown>, keys: string[]) =>
  Object.keys(value).length === keys.length &&
  keys.every((key) => key in value);
const validName = (value: unknown) =>
  typeof value === "string" && value.trim().length >= 2 && value.length <= 60;
const integerInRange = (
  value: unknown,
  min: number,
  max: number,
): value is number =>
  typeof value === "number" &&
  Number.isInteger(value) &&
  value >= min &&
  value <= max;

const validOptions = (value: unknown, minimumPrice: number) => {
  if (!Array.isArray(value) || value.length < 1 || value.length > 10)
    return false;
  const names = new Set<string>();
  return value.every((option) => {
    if (
      !isRecord(option) ||
      !hasKeys(option, ["name", "priceCents"]) ||
      !validName(option.name) ||
      !integerInRange(option.priceCents, minimumPrice, 99999999)
    )
      return false;
    const name = (option.name as string).trim().toLocaleLowerCase("pt-BR");
    if (names.has(name)) return false;
    names.add(name);
    return true;
  });
};

export const validateProductCustomization = (value: unknown): string => {
  if (value === undefined) return "";
  if (
    !isRecord(value) ||
    !hasKeys(value, ["groups", "division"]) ||
    !Array.isArray(value.groups) ||
    value.groups.length > 5
  )
    return "Cadastre até 5 grupos de complementos.";
  let totalOptions = 0;
  const names = new Set<string>();
  for (const group of value.groups) {
    if (
      !isRecord(group) ||
      !hasKeys(group, ["name", "min", "max", "repeat", "options"]) ||
      !validName(group.name)
    )
      return "Informe um nome entre 2 e 60 caracteres para cada grupo.";
    const name = (group.name as string).trim().toLocaleLowerCase("pt-BR");
    if (names.has(name))
      return "Use nomes diferentes para os grupos de complementos.";
    names.add(name);
    if (!validOptions(group.options, 0))
      return "Cada grupo precisa de 1 a 10 opções com nomes únicos e preços válidos. Use zero para opções gratuitas.";
    const options = group.options as unknown[];
    if (
      !integerInRange(group.min, 0, 20) ||
      !integerInRange(group.max, 1, 20) ||
      group.min > group.max ||
      typeof group.repeat !== "boolean"
    )
      return "Confira o mínimo e o máximo de escolhas de cada grupo (até 20 unidades).";
    if (!group.repeat && group.max > options.length)
      return "Sem repetição, o máximo de escolhas não pode exceder a quantidade de opções.";
    totalOptions += options.length;
  }
  if (value.division !== null) {
    const division = value.division;
    if (
      !isRecord(division) ||
      !hasKeys(division, ["maxParts", "pricing", "options"]) ||
      !integerInRange(division.maxParts, 2, 8) ||
      !["fixed", "highest", "proportional"].includes(String(division.pricing))
    )
      return "Defina de 2 a 8 partes e a regra de preço da divisão.";
    if (
      !validOptions(division.options, division.pricing === "fixed" ? 0 : 1) ||
      (division.options as unknown[]).length < 2
    )
      return "Cadastre de 2 a 10 opções de divisão, com nomes únicos e o preço do produto inteiro para cada opção.";
    totalOptions += (division.options as unknown[]).length;
  }
  if (totalOptions > 20)
    return "Cadastre até 20 opções no total, somando complementos e divisão.";
  return "";
};

export const normalizeProductCustomization = (
  value: ProductCustomization,
): ProductCustomization => ({
  groups: value.groups.map((group) => ({
    ...group,
    name: group.name.trim(),
    options: group.options.map((option) => ({
      ...option,
      name: option.name.trim(),
    })),
  })),
  division: value.division
    ? {
        ...value.division,
        options: value.division.options.map((option) => ({
          ...option,
          name: option.name.trim(),
        })),
      }
    : null,
});
