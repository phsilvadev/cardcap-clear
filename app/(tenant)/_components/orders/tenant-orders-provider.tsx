"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { onIdTokenChanged } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { getDemoOrderStore } from "@/lib/orders/demo-store";
import {
  orderOperation,
  orderError,
  type OrdersPage,
  type PrintingConfiguration,
  type PrintAttention,
} from "@/lib/orders/service";
import type { DashboardOrder, OrderStatus } from "@/lib/types";
import type { PrinterStatus } from "@/lib/printing/types";
const emptyPrinting: PrintingConfiguration = {
  autoAccept: false,
  deviceId: "",
  deviceName: "",
};
type ContextValue = {
  orders: DashboardOrder[];
  printing: PrintingConfiguration;
  attention: PrintAttention[];
  loading: boolean;
  error: string;
  message: string;
  busy: boolean;
  hasMore: boolean;
  desktop: PrinterStatus | null;
  refresh: () => Promise<void>;
  loadMore: () => void;
  transition: (
    id: string,
    target: OrderStatus,
    reason?: string,
  ) => Promise<boolean>;
  assign: (orderId: string, courierId: string) => void;
  setAutoAccept: (enabled: boolean) => void;
  setDevice: (deviceId: string, deviceName: string) => void;
  retryPrint: (jobId: string) => void;
};
const Context = createContext<ContextValue>({
  orders: [],
  printing: emptyPrinting,
  attention: [],
  loading: true,
  error: "",
  message: "",
  busy: false,
  hasMore: false,
  desktop: null,
  refresh: async () => {},
  loadMore() {},
  transition: async () => false,
  assign() {},
  setAutoAccept() {},
  setDevice() {},
  retryPrint() {},
});
export const useTenantOrders = () => useContext(Context);
export default function TenantOrdersProvider({
  storeId,
  slug,
  children,
}: {
  storeId: string;
  slug: string;
  children: ReactNode;
}) {
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [printing, setPrinting] = useState(emptyPrinting);
  const [attention, setAttention] = useState<PrintAttention[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [desktop, setDesktop] = useState<PrinterStatus | null>(null);
  const pages = useRef(1);
  const locked = useRef(false);
  const refreshing = useRef(false);
  const active = useRef(false);
  const generation = useRef(0);
  const currentOrders = useRef(orders);
  currentOrders.current = orders;
  const refresh = useCallback(async () => {
    if (!active.current || refreshing.current) return;
    refreshing.current = true;
    const revision = generation.current;
    try {
      let cursor: string | null = null;
      let list: DashboardOrder[] = [];
      let result: OrdersPage | undefined;
      for (let page = 0; page < pages.current; page++) {
        result = await orderOperation<OrdersPage>(
          storeId,
          "list",
          cursor ? { cursor } : {},
        );
        list.push(...result.orders);
        cursor = result.cursor;
        if (!cursor) break;
      }
      if (!active.current || revision !== generation.current || !result) return;
      list = list.filter(
        (order, index) =>
          list.findIndex((other) => other.id === order.id) === index,
      );
      setOrders(list);
      setPrinting(result.printing);
      setAttention(result.attention);
      setHasMore(Boolean(cursor) && pages.current < 20);
      setError("");
      getDemoOrderStore(slug).syncServerOrders(list);
    } catch (cause) {
      if (active.current && revision === generation.current)
        setError(orderError(cause));
    } finally {
      refreshing.current = false;
      if (active.current && revision === generation.current) setLoading(false);
    }
  }, [storeId, slug]);
  const run = useCallback(
    async (action: string, fields: Record<string, unknown>, notice: string) => {
      if (locked.current || !active.current) return false;
      locked.current = true;
      setBusy(true);
      setError("");
      setMessage("");
      try {
        await orderOperation(storeId, action, fields);
        if (active.current) setMessage(notice);
        await refresh();
        return true;
      } catch (cause) {
        if (active.current) setError(orderError(cause));
        return false;
      } finally {
        locked.current = false;
        if (active.current) setBusy(false);
      }
    },
    [storeId, refresh],
  );
  const transition = useCallback(
    async (id: string, target: OrderStatus, reason?: string) => {
      const order = currentOrders.current.find((item) => item.id === id);
      if (!order) return false;
      return run(
        "transition",
        {
          orderId: id,
          expected: order.status,
          target,
          ...(reason ? { reason } : {}),
        },
        `Pedido #${id} atualizado.`,
      );
    },
    [run],
  );
  useEffect(() => {
    const store = getDemoOrderStore(slug);
    store.connectRemoteOrders({
      advance: (id) => {
        const order = currentOrders.current.find((item) => item.id === id);
        const targets: Partial<Record<OrderStatus, OrderStatus>> = {
          new: "preparing",
          preparing: "delivery",
          delivery: "done",
        };
        if (order && targets[order.status])
          void transition(id, targets[order.status]!);
      },
    });
    let cancelled = false;
    const unsubscribe = onIdTokenChanged(getFirebaseAuth(), async (user) => {
      const revision = ++generation.current;
      active.current = false;
      setOrders([]);
      store.syncServerOrders([]);
      if (user?.uid !== storeId) {
        setLoading(false);
        setError("Entre com a conta do proprietário para acessar os pedidos.");
        void window.cardapPrinter?.disconnect?.().catch(() => {});
        return;
      }
      active.current = true;
      setLoading(true);
      void refresh();
      try {
        const idToken = await user.getIdToken();
        if (cancelled || generation.current !== revision) return;
        if (
          window.cardapPrinter &&
          typeof window.cardapPrinter.connect !== "function"
        ) {
          setError(
            "Atualize e reabra o Cardap Impressão para conectar a fila do Firebase.",
          );
          return;
        }
        await window.cardapPrinter?.connect({ storeId, idToken });
      } catch {
        if (!cancelled)
          setError(
            "Não foi possível vincular o aplicativo à sessão. Confira a conexão.",
          );
      }
    });
    const timer = setInterval(() => {
      void refresh();
    }, 10000);
    const status = () => {
      void window.cardapPrinter
        ?.status()
        .then((value) => {
          if (!cancelled)
            setDesktop(typeof value.deviceId === "string" ? value : null);
        })
        .catch(() => {
          if (!cancelled) setDesktop(null);
        });
    };
    status();
    const statusTimer = setInterval(status, 3000);
    const focus = () => {
      void refresh();
    };
    window.addEventListener("focus", focus);
    return () => {
      cancelled = true;
      active.current = false;
      generation.current++;
      unsubscribe();
      clearInterval(timer);
      clearInterval(statusTimer);
      window.removeEventListener("focus", focus);
      void window.cardapPrinter?.disconnect?.().catch(() => {});
      store.syncServerOrders([]);
    };
  }, [storeId, slug, refresh, transition]);
  useEffect(() => {
    if (!loading) void window.cardapPrinter?.ready?.().catch(() => {});
  }, [loading]);
  return (
    <Context.Provider
      value={{
        orders,
        printing,
        attention,
        loading,
        error,
        message,
        busy,
        hasMore,
        desktop,
        refresh,
        loadMore: () => {
          if (pages.current < 20) {
            pages.current++;
            void refresh();
          }
        },
        transition,
        assign: (orderId, courierId) => {
          void run(
            "assignCourier",
            { orderId, courierId },
            "Entregador atualizado.",
          );
        },
        setAutoAccept: (enabled) => {
          void run(
            "setAutoAccept",
            { enabled },
            enabled
              ? "Aceite automático ativado para a loja."
              : "Aceite automático desativado.",
          );
        },
        setDevice: (deviceId, deviceName) => {
          void run(
            "setDevice",
            { deviceId, deviceName, expectedDeviceId: printing.deviceId },
            deviceId
              ? "Computador responsável atualizado."
              : "Impressão automática pausada.",
          );
        },
        retryPrint: (jobId) => {
          void run(
            "retry",
            { jobId, confirmed: true },
            "Comanda reenviada à fila.",
          );
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
