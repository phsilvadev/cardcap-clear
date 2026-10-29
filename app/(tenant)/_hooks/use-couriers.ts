"use client";
import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";
import { getDemoOrderStore } from "@/lib/orders/demo-store";
import type { DeliveryCourier } from "@/lib/types";

export const courierVehicles = {
  motorcycle: "Moto",
  bicycle: "Bicicleta",
  car: "Carro",
  foot: "A pé",
} as const;
const emptyDraft: Omit<DeliveryCourier, "id"> = {
  name: "",
  phone: "",
  vehicle: "motorcycle",
  available: true,
};
export function useCouriers(tenantSlug: string) {
  const store = useMemo(() => getDemoOrderStore(tenantSlug), [tenantSlug]);
  const state = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
  const [ready, setReady] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string>();
  const [draft, setDraft] = useState(emptyDraft);
  const [formError, setFormError] = useState("");
  const [removing, setRemoving] = useState<DeliveryCourier | null>(null);
  const [removeError, setRemoveError] = useState("");
  useEffect(() => {
    store.hydrate();
    setReady(true);
  }, [store]);
  const rows = state.couriers.map((courier) => {
    const assigned = state.orders.filter(
      (order) => order.courierId === courier.id && order.status !== "done",
    );
    const inDelivery = assigned.some((order) => order.status === "delivery");
    const status: "delivering" | "available" | "unavailable" = inDelivery
      ? "delivering"
      : courier.available
        ? "available"
        : "unavailable";
    return { ...courier, assigned, state: status };
  });
  const query = search.trim().toLocaleLowerCase("pt-BR");
  const digits = query.replace(/\D/g, "");
  const visible = rows.filter(
    (courier) =>
      (filter === "all" || courier.state === filter) &&
      (courier.name.toLocaleLowerCase("pt-BR").includes(query) ||
        Boolean(digits && courier.phone.includes(digits))),
  );
  const add = () => {
    setEditingId(undefined);
    setDraft({ ...emptyDraft });
    setFormError("");
    setFormOpen(true);
  };
  const edit = (courier: DeliveryCourier) => {
    setEditingId(courier.id);
    setDraft({
      name: courier.name,
      phone: courier.phone,
      vehicle: courier.vehicle,
      available: courier.available,
    });
    setFormError("");
    setFormOpen(true);
  };
  const updateDraft = (fields: Partial<typeof draft>) => {
    setFormError("");
    setDraft((current) => ({ ...current, ...fields }));
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (store.saveCourier(editingId, draft)) setFormOpen(false);
    else setFormError(store.getSnapshot().message);
  };
  const askRemove = (courier: DeliveryCourier) => {
    setRemoving(courier);
    setRemoveError("");
  };
  const confirmRemove = () => {
    if (!removing) return;
    if (store.removeCourier(removing.id)) setRemoving(null);
    else setRemoveError(store.getSnapshot().message);
  };
  return {
    ready,
    search,
    setSearch,
    filter,
    setFilter,
    visible,
    total: rows.length,
    available: rows.filter((item) => item.state === "available").length,
    delivering: rows.filter((item) => item.state === "delivering").length,
    message: state.message,
    formOpen,
    editingId,
    draft,
    formError,
    add,
    edit,
    updateDraft,
    submit,
    closeForm: () => setFormOpen(false),
    toggle: store.toggleCourier,
    removing,
    askRemove,
    confirmRemove,
    removeError,
    cancelRemove: () => setRemoving(null),
  };
}
