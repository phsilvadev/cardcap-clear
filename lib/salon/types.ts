export type Payment = {
  id: string;
  amountCents: number;
  method: "cash" | "pix" | "card";
  payer: string;
  recordedBy: string;
  recordedAt: number;
  voided: boolean;
  voidReason?: string;
};
export type TabLine = {
  orderId: string;
  productId: string;
  name: string;
  quantity: number;
  priceCents: number;
};
export type SalonTab = {
  id: string;
  status: "open" | "requested" | "closed" | "void";
  guests: number;
  lines: TabLine[];
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  paidCents: number;
  remainingCents: number;
  payments: Payment[];
  discountReason: string;
  openedAt: number;
  closedAt: number | null;
};
export type SalonTable = {
  id: string;
  name: string;
  status: "available" | "occupied" | "bill_requested" | "awaiting_cleaning";
  guests: number;
  tabId: string | null;
  tab: SalonTab | null;
};
export type SalonState = {
  actor: {
    uid: string;
    storeId: string;
    name: string;
    role: string;
    canReceive: boolean;
    canDiscount: boolean;
    canManage: boolean;
    canClean: boolean;
  };
  tables: SalonTable[];
  orders: {
    id: string;
    tableId: string;
    tabId: string;
    status: "new" | "preparing" | "ready" | "served" | "cancelled";
    items: {
      productId: string;
      name: string;
      quantity: number;
      price: number;
    }[];
    notes: string;
    time: string;
  }[];
};
export const tableLabels: Record<SalonTable["status"], string> = {
  available: "Disponível",
  occupied: "Em atendimento",
  bill_requested: "Conta solicitada",
  awaiting_cleaning: "Aguardando limpeza",
};
export const paymentLabels = { cash: "Dinheiro", pix: "Pix", card: "Cartão" };
export const money = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    cents / 100,
  );
export function parseMoney(value: string) {
  const input = value.trim().replace(",", ".");
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(input)) return NaN;
  const [whole, fraction = ""] = input.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}
