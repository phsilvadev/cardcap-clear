export type PublicStore = {
  slug: string;
  name: string;
  description: string;
  category: string;
  logoUrl: string | null;
  receivingOrders: boolean;
  city: string;
  state: string;
  street: string;
  number: string;
  district: string;
  openingDay: string;
  closingDay: string;
  openingTime: string;
  closingTime: string;
  acceptsDelivery: boolean;
  acceptsPickup: boolean;
  deliveryTime: string;
  deliveryFeeCents: number | null;
};
export type PublicProduct = {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  priceCents: number;
  imageUrl: string | null;
};
export type StorefrontResult = {
  store: PublicStore;
  categories: { id: string; name: string }[];
  products: PublicProduct[];
  nextProductCursor: string | null;
  preview: boolean;
};
export type StoreListing = { stores: PublicStore[]; nextCursor: string | null };
export const categoryLabels: Record<string, string> = {
  restaurante: "Restaurante",
  lanchonete: "Lanchonete",
  pizzaria: "Pizzaria",
  cafeteria: "Cafeteria",
  padaria: "Padaria",
  doceria: "Doceria",
  mercado: "Mercado",
  outros: "Outros",
};
export const normalizeSearch = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
export const formatMoney = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    cents / 100,
  );
