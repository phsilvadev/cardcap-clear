import type { PricedLine } from "@/lib/checkout/types";
export type CustomerAddress = {
  id: string;
  label: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zip: string;
  isDefault: boolean;
};
export type CustomerProfile = {
  uid: string;
  name: string;
  email: string;
  phone: string;
  emailVerified: boolean;
  addresses: CustomerAddress[];
  favorites: { slug: string; name: string }[];
};
export type CustomerOrder = {
  id: string;
  storeName: string;
  slug: string;
  createdAtMs: number;
  status: string;
  payment: string;
  paymentStatus: string;
  totalCents: number;
  shippingCents: number;
  fulfillment: string;
  address: string;
  notes: string;
  lines: PricedLine[];
  cancellationReason: string;
};
export type OrderCursor = { createdAtMs: number; id: string } | null;
export const orderLabels: Record<string, string> = {
  new: "Recebido",
  preparing: "Em preparo",
  delivery: "Saiu para entrega / pronto para retirada",
  done: "Concluído",
  cancelled: "Cancelado",
  awaiting_payment: "Aguardando pagamento",
  expired: "Pagamento expirado",
};
export const paymentLabels: Record<string, string> = {
  awaiting_payment: "Aguardando pagamento",
  paid: "Pago",
  due_on_fulfillment: "Pagar na entrega ou retirada",
  refunded: "Estornado",
  expired: "Expirado",
};
export function addressText(address: CustomerAddress) {
  return `${address.street}, ${address.number}${address.complement ? `, ${address.complement}` : ""} — ${address.neighborhood}, ${address.city}/${address.state}, CEP ${address.zip}`;
}
