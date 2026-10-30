export type CheckoutStep =
  "carrinho" | "checkout" | "pagamento" | "pedido-confirmado";
export type Fulfillment = "delivery" | "pickup";
export type PaymentMethod = "pix" | "card" | "cash";

export interface CartItem {
  name: string;
  price: number;
  quantity: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  demo: boolean;
}

export interface CheckoutDraft {
  customer: string;
  phone: string;
  address: string;
  fulfillment: Fulfillment;
  notes?: string;
}

export interface DemoOrder {
  id: string;
  customer: string;
  fulfillment: Fulfillment;
  address: string;
  payment: PaymentMethod;
  items: CartItem[];
  total: number;
}

export type OrderStatus =
  "new" | "preparing" | "delivery" | "done" | "cancelled";
export type CourierVehicle = "motorcycle" | "bicycle" | "car" | "foot";
export interface DeliveryCourier {
  id: string;
  name: string;
  phone: string;
  vehicle: CourierVehicle;
  available: boolean;
}
export interface DashboardOrder {
  id: string;
  customer: string;
  items: string;
  total: number;
  status: OrderStatus;
  time: string;
  courierId?: string;
  courierName?: string;
  cancellationReason?: string;
}

export interface DashboardState {
  open: boolean;
  settings: { name: string; phone: string; description: string };
  orders: DashboardOrder[];
  products: { name: string; price: number; active: boolean }[];
}
