"use client";
import { useState, useSyncExternalStore } from "react";
import { useDeliveryTeam } from "./use-delivery-team";
export { courierVehicles } from "@/lib/employees/couriers";
export function useCouriers(tenantSlug: string, storeId: string) {
  const team = useDeliveryTeam(tenantSlug, storeId);
  const { store } = team;
  const state = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const rows = (team.ready ? state.couriers : []).map((courier) => {
    const assigned = state.orders.filter(
      (order) =>
        order.courierId === courier.id &&
        !["done", "cancelled"].includes(order.status),
    );
    const status: "delivering" | "available" | "unavailable" = assigned.some(
      (order) => order.status === "delivery",
    )
      ? "delivering"
      : courier.available
        ? "available"
        : "unavailable";
    return { ...courier, assigned, state: status };
  });
  const query = search.trim().toLocaleLowerCase("pt-BR");
  const digits = query.replace(/\D/g, "");
  return {
    ready: team.ready,
    error: team.error,
    retry: team.retry,
    search,
    setSearch,
    filter,
    setFilter,
    visible: rows.filter(
      (courier) =>
        (filter === "all" || courier.state === filter) &&
        (courier.name.toLocaleLowerCase("pt-BR").includes(query) ||
          Boolean(digits && courier.phone.includes(digits))),
    ),
    total: rows.length,
    available: rows.filter((item) => item.state === "available").length,
    delivering: rows.filter((item) => item.state === "delivering").length,
    message: state.message,
    toggle: (id: string) => {
      if (team.ready) store.toggleCourier(id);
    },
  };
}
