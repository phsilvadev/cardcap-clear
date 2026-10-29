export type ProductOption = { name: string; priceCents: number };
export type ProductComplementGroup = {
  name: string;
  min: number;
  max: number;
  repeat: boolean;
  options: ProductOption[];
};
export type ProductDivision = {
  maxParts: number;
  pricing: "fixed" | "highest" | "proportional";
  options: ProductOption[];
};
export type ProductCustomization = {
  groups: ProductComplementGroup[];
  division: ProductDivision | null;
};

export type MenuProductInput = {
  name: string;
  description: string;
  categoryId: string;
  priceCents: number;
  available: boolean;
  customization?: ProductCustomization;
};

export type MenuProduct = MenuProductInput & {
  id: string;
  storeId: string;
  imagePath?: string;
};
