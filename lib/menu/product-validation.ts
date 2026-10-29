import type { MenuProductInput } from "@/lib/menu/types";
import { validateProductCustomization } from "@/lib/menu/customization";

export const parseProductPrice = (value: string): number => {
  const normalized = value.trim().replace(",", ".");
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(normalized)) return NaN;
  const [whole, fraction = ""] = normalized.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
};

export const validateMenuProduct = (input: MenuProductInput): string => {
  if (
    typeof input.name !== "string" ||
    input.name.trim().length < 2 ||
    input.name.length > 100
  )
    return "Informe um nome entre 2 e 100 caracteres.";
  if (typeof input.description !== "string" || input.description.length > 500)
    return "A descrição deve ter no máximo 500 caracteres.";
  if (
    typeof input.categoryId !== "string" ||
    !input.categoryId ||
    input.categoryId.includes("/") ||
    input.categoryId.length > 1500
  )
    return "Selecione uma categoria válida.";
  if (
    !Number.isInteger(input.priceCents) ||
    input.priceCents < 1 ||
    input.priceCents > 99999999
  )
    return "Informe um preço entre R$ 0,01 e R$ 999.999,99, com até duas casas decimais.";
  if (typeof input.available !== "boolean")
    return "Informe a disponibilidade do produto.";
  return validateProductCustomization(input.customization);
};

export const formatProductPrice = (priceCents: number): string =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    priceCents / 100,
  );
