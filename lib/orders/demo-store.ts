import type { DashboardOrder, OrderStatus, DeliveryCourier } from "@/lib/types";

export const orderStages: {
  id: OrderStatus;
  label: string;
  description: string;
  action?: string;
  next?: OrderStatus;
}[] = [
  {
    id: "new",
    label: "Novos",
    description: "Aguardando confirmação",
    action: "Aceitar pedido",
    next: "preparing",
  },
  {
    id: "preparing",
    label: "Em preparo",
    description: "Pedidos na cozinha",
    action: "Enviar para entrega",
    next: "delivery",
  },
  {
    id: "delivery",
    label: "Em entrega",
    description: "A caminho do cliente",
    action: "Concluir pedido",
    next: "done",
  },
  { id: "done", label: "Concluídos", description: "Atendimento finalizado" },
];
const initialOrders: DashboardOrder[] = [
  {
    id: "1048",
    customer: "Mariana Costa",
    items: "2 × Prato da casa",
    total: 5980,
    status: "new",
    time: "Há 3 min",
  },
  {
    id: "1047",
    customer: "Pedro Alves",
    items: "1 × Executivo de frango · 1 × Água mineral",
    total: 3180,
    status: "preparing",
    time: "Há 12 min",
  },
  {
    id: "1046",
    customer: "Ana Souza",
    items: "2 × Opção vegetariana",
    total: 4980,
    status: "delivery",
    time: "Há 24 min",
  },
  {
    id: "1045",
    customer: "Lucas Lima",
    items: "1 × Prato da casa",
    total: 2990,
    status: "done",
    time: "Há 40 min",
  },
  {
    id: "1044",
    customer: "Carla Santos",
    items: "2 × Executivo de frango",
    total: 5380,
    status: "done",
    time: "Há 55 min",
  },
];
type Snapshot = {
  orders: DashboardOrder[];
  couriers: DeliveryCourier[];
  filter: "all" | OrderStatus;
  search: string;
  message: string;
};
type StorageAccess = Pick<Storage, "getItem" | "setItem">;
export function createDemoOrderStore(
  slug: string,
  storage?: () => StorageAccess,
) {
  const key = `cardap-demo-dashboard:${slug}`;
  let snapshot: Snapshot = {
    orders: initialOrders.map((order) => ({ ...order })),
    couriers: [],
    filter: "all",
    search: "",
    message: "",
  };
  const serverSnapshot = snapshot;
  let hydrated = false;
  let teamReady = false;
  const listeners = new Set<() => void>();
  const publish = (patch: Partial<Snapshot>) => {
    snapshot = { ...snapshot, ...patch };
    listeners.forEach((listener) => listener());
  };
  const readSaved = () => {
    const value: unknown = JSON.parse(storage?.().getItem(key) ?? "{}");
    return value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  };
  const persist = (
    patch: Partial<Pick<Snapshot, "orders" | "couriers">>,
    message: string,
  ) => {
    const next = {
      orders: snapshot.orders,
      couriers: snapshot.couriers,
      ...patch,
    };
    try {
      storage?.().setItem(key, JSON.stringify({ ...readSaved(), ...next }));
    } catch {
      publish({
        message:
          "Não foi possível salvar a alteração. Os dados anteriores foram mantidos.",
      });
      return false;
    }
    publish({ ...next, message });
    return true;
  };
  return {
    getSnapshot: () => snapshot,
    getServerSnapshot: () => serverSnapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    hydrate: () => {
      if (hydrated) return;
      hydrated = true;
      try {
        const saved = readSaved();
        if (Array.isArray(saved.couriers)) {
          const couriers = saved.couriers.filter(
            (item): item is DeliveryCourier => {
              if (!item || typeof item !== "object") return false;
              const value = item as DeliveryCourier;
              return (
                typeof value.id === "string" &&
                value.id.length <= 100 &&
                typeof value.name === "string" &&
                value.name.trim().length >= 2 &&
                value.name.length <= 100 &&
                typeof value.phone === "string" &&
                /^\d{10,11}$/.test(value.phone) &&
                ["motorcycle", "bicycle", "car", "foot"].includes(
                  value.vehicle,
                ) &&
                typeof value.available === "boolean"
              );
            },
          );
          publish({
            couriers: couriers.filter(
              (item, index) =>
                couriers.findIndex((other) => other.id === item.id) === index,
            ),
          });
        }
        if (Array.isArray(saved.orders)) {
          const savedOrders = saved.orders as {
            id?: unknown;
            status?: unknown;
            courierId?: unknown;
            courierName?: unknown;
          }[];
          publish({
            orders: initialOrders.map((order) => {
              const previous = savedOrders.find(
                (item) => item && item.id === order.id,
              );
              return {
                ...order,
                ...(typeof previous?.courierId === "string" &&
                previous.courierId.length <= 100
                  ? { courierId: previous.courierId }
                  : {}),
                ...(typeof previous?.courierName === "string" &&
                previous.courierName.length <= 100
                  ? { courierName: previous.courierName }
                  : {}),
                status: orderStages.some(
                  (stage) => stage.id === previous?.status,
                )
                  ? (previous!.status as OrderStatus)
                  : order.status,
              };
            }),
          });
        }
      } catch {
        publish({
          message: "Não foi possível carregar os pedidos salvos nesta sessão.",
        });
      }
    },
    setFilter: (filter: Snapshot["filter"]) => publish({ filter, search: "" }),
    setSearch: (search: string) => publish({ search }),
    beginCourierSync: () => {
      teamReady = false;
    },
    syncCourierTeam: (couriers: DeliveryCourier[]) => {
      teamReady = true;
      publish({ couriers });
    },
    toggleCourier: (id: string) => {
      const courier = snapshot.couriers.find((item) => item.id === id);
      if (!courier) return false;
      return persist(
        {
          couriers: snapshot.couriers.map((item) =>
            item.id === id ? { ...item, available: !item.available } : item,
          ),
        },
        "Disponibilidade atualizada.",
      );
    },
    assignCourier: (orderId: string, courierId: string) => {
      if (!teamReady) {
        publish({ message: "Aguarde a atualização da equipe de entregas." });
        return false;
      }
      const order = snapshot.orders.find((item) => item.id === orderId);
      if (!order || !["preparing", "delivery"].includes(order.status)) {
        publish({
          message: "Atribua entregadores a pedidos em preparo ou em entrega.",
        });
        return false;
      }
      const courier = snapshot.couriers.find((item) => item.id === courierId);
      if (
        courierId &&
        (!courier ||
          !courier.available ||
          snapshot.orders.some(
            (item) =>
              item.id !== orderId &&
              item.status === "delivery" &&
              item.courierId === courierId,
          ))
      ) {
        publish({
          message:
            "Este entregador está indisponível ou já está em outra entrega.",
        });
        return false;
      }
      const orders = snapshot.orders.map((item) => {
        if (item.id !== orderId) return item;
        const {
          courierId: previousId,
          courierName: previousName,
          ...fields
        } = item;
        return courier
          ? { ...fields, courierId, courierName: courier.name }
          : fields;
      });
      return persist(
        { orders },
        courier
          ? `Pedido #${orderId} atribuído a ${courier.name}.`
          : `Entregador removido do pedido #${orderId}.`,
      );
    },
    advance: (id: string) => {
      const order = snapshot.orders.find((item) => item.id === id);
      const next = orderStages.find(
        (stage) => stage.id === order?.status,
      )?.next;
      if (!order || !next) return;
      if (next === "delivery" && order.courierId) {
        if (!teamReady) {
          publish({ message: "Aguarde a atualização da equipe de entregas." });
          return false;
        }
        const courier = snapshot.couriers.find(
          (item) => item.id === order.courierId,
        );
        if (
          !courier?.available ||
          snapshot.orders.some(
            (item) =>
              item.id !== id &&
              item.status === "delivery" &&
              item.courierId === courier.id,
          )
        ) {
          publish({
            message:
              "Selecione um entregador disponível antes de enviar o pedido para entrega.",
          });
          return;
        }
      }
      const orders = snapshot.orders.map((item) =>
        item.id === id ? { ...item, status: next } : item,
      );
      persist(
        { orders },
        `Pedido #${id}: ${orderStages.find((stage) => stage.id === next)!.label.toLocaleLowerCase("pt-BR")}.`,
      );
    },
  };
}
const stores = new Map<string, ReturnType<typeof createDemoOrderStore>>();
export function getDemoOrderStore(slug: string) {
  if (typeof window === "undefined") return createDemoOrderStore(slug);
  let store = stores.get(slug);
  if (!store) {
    store = createDemoOrderStore(slug, () => window.sessionStorage);
    stores.set(slug, store);
  }
  return store;
}
