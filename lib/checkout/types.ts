import type { ProductCustomization } from "@/lib/menu/types";
import type { PublicStore } from "@/lib/storefront/types";
export type SelectionItem = {
  productId: string;
  quantity: number;
  groups?: {
    groupIndex: number;
    options: { optionIndex: number; quantity: number }[];
  }[];
  parts?: number[];
};
export type PricedLine = Required<SelectionItem> & {
  name: string;
  unitCents: number;
  totalCents: number;
  details: string[];
};
export type CartEntry = SelectionItem & {
  key: string;
  name: string;
  priceCents: number;
  details: string[];
};
export type CheckoutDraft = {
  name: string;
  phone: string;
  address: string;
  cpf: string;
  notes: string;
  fulfillment: "delivery" | "pickup";
};
export type Quote = {
  lines: PricedLine[];
  shippingCents: number;
  totalCents: number;
  pricingHash: string;
  pixEnabled: boolean;
};
export type CheckoutReceipt = {
  id: string;
  orderId: string | null;
  payment: "pix" | "card" | "cash";
  paymentStatus:
    "awaiting_payment" | "paid" | "due_on_fulfillment" | "refunded" | "expired";
  totalCents: number;
  shippingCents: number;
  lines: PricedLine[];
  fulfillment: string;
};
export type ProductResult = {
  store: PublicStore;
  product: {
    id: string;
    name: string;
    description: string;
    priceCents: number;
    customization: ProductCustomization;
    imageUrl: string | null;
  };
  preview: boolean;
};
