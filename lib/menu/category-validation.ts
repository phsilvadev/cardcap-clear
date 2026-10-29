import type { MenuCategoryInput } from "@/lib/menu/category-types";

export const normalizeMenuCategory = (
  input: MenuCategoryInput,
): MenuCategoryInput => ({
  name:
    typeof input.name === "string"
      ? input.name.trim().replace(/\s+/g, " ")
      : "",
  description:
    typeof input.description === "string" ? input.description.trim() : "",
});

export const validateMenuCategory = (input: MenuCategoryInput): string => {
  if (
    typeof input.name !== "string" ||
    input.name.length < 2 ||
    input.name.length > 60
  ) {
    return "Informe um nome de categoria entre 2 e 60 caracteres.";
  }
  if (typeof input.description !== "string" || input.description.length > 200) {
    return "A descrição deve ter no máximo 200 caracteres.";
  }
  return "";
};

export const getMenuCategoryId = (name: string): string =>
  `category_${encodeURIComponent(name.normalize("NFC").toLocaleLowerCase("pt-BR"))}`;
