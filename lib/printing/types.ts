import type { DashboardOrder } from "@/lib/types";
export type PrintPayload = {
  id: string;
  storeId: string;
  storeName: string;
  order: DashboardOrder;
  retry?: boolean;
};
export type PrinterStatus = {
  configured: boolean;
  name: string;
  deviceId: string;
  deviceName: string;
  storeId: string | null;
  error: string;
};
declare global {
  interface Window {
    cardapPrinter?: {
      ready: () => Promise<void>;
      status: () => Promise<PrinterStatus>;
      connect: (session: { storeId: string; idToken: string }) => Promise<void>;
      disconnect: () => Promise<void>;
      configure: () => Promise<void>;
    };
  }
}
