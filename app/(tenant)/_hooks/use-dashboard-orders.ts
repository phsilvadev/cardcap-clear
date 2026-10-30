"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useTenantOrders } from "../_components/orders/tenant-orders-provider";
import { orderStages } from "@/lib/orders/demo-store";
import { useDeliveryTeam } from "./use-delivery-team";
export function useDashboardOrders(tenantSlug: string, storeId?: string) {
  const cloud = useTenantOrders();
  const team = useDeliveryTeam(tenantSlug, storeId);
  const { store } = team;
  const state = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
  useEffect(() => {
    store.hydrate();
    const searchParams = new URLSearchParams(window.location.search);
    const status = searchParams.get("status");
    if (status === "all" || orderStages.some((stage) => stage.id === status))
      store.setFilter(status as "all" | (typeof orderStages)[number]["id"]);
    const orderId = searchParams.get("pedido");
    if (orderId) {
      store.setFilter("all");
      store.setSearch(orderId);
    }
  }, [store]);
  const [selectedId, setSelectedId] = useState("1048");
  const search = state.search.trim().toLocaleLowerCase("pt-BR");
  const matching = cloud.orders.filter((order) =>
    `#${order.id} ${order.customer} ${order.items}`
      .toLocaleLowerCase("pt-BR")
      .includes(search),
  );
  const stages = orderStages.map((stage) => ({
    ...stage,
    label:
      stage.id === "delivery" &&
      cloud.orders.some((order) => order.source === "salon")
        ? "Prontos / em entrega"
        : stage.label,
    count: cloud.orders.filter((order) => order.status === stage.id).length,
    orders: matching.filter((order) => order.status === stage.id),
  }));
  return {
    ...state,
    selected:
      matching.find(
        (order) =>
          order.id === selectedId &&
          (state.filter === "all" || state.filter === order.status),
      ) ??
      matching.find(
        (order) => state.filter === "all" || state.filter === order.status,
      ),
    select: setSelectedId,
    cancel: (id: string, reason: string) =>
      cloud.transition(id, "cancelled", reason),
    loading: cloud.loading,
    error: cloud.error,
    busy: cloud.busy,
    hasMore: cloud.hasMore,
    loadMore: cloud.loadMore,
    refresh: cloud.refresh,
    message: cloud.message,
    total: cloud.orders.length,
    activeCount: cloud.orders.filter(
      (order) => !["done", "cancelled"].includes(order.status),
    ).length,
    stages: stages.filter(
      (stage) => state.filter === "all" || state.filter === stage.id,
    ),
    allStages: stages,
    setSearch: store.setSearch,
    setFilter: store.setFilter,
    advance: (id: string) => {
      const order = cloud.orders.find((item) => item.id === id);
      const stage = orderStages.find((item) => item.id === order?.status);
      if (stage?.next) void cloud.transition(id, stage.next);
    },
    assignCourier: cloud.assign,
    teamError: team.error,
    retryTeam: team.retry,
    deliveryCouriers: (team.ready ? state.couriers : []).map((courier) => ({
      ...courier,
      busy: cloud.orders.some(
        (order) =>
          order.status === "delivery" && order.courierId === courier.id,
      ),
    })),
  };
}
