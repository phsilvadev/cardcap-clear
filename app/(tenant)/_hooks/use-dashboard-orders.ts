"use client";
import { useEffect, useSyncExternalStore } from "react";
import { orderStages } from "@/lib/orders/demo-store";
import { useDeliveryTeam } from "./use-delivery-team";
export function useDashboardOrders(tenantSlug: string, storeId?: string) {
  const team = useDeliveryTeam(tenantSlug, storeId);
  const { store } = team;
  const state = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
  useEffect(() => {
    store.hydrate();
    const orderId = new URLSearchParams(window.location.search).get("pedido");
    if (
      orderId &&
      store.getSnapshot().orders.some((order) => order.id === orderId)
    ) {
      store.setFilter("all");
      store.setSearch(orderId);
    }
  }, [store]);
  const search = state.search.trim().toLocaleLowerCase("pt-BR");
  const matching = state.orders.filter((order) =>
    `#${order.id} ${order.customer} ${order.items}`
      .toLocaleLowerCase("pt-BR")
      .includes(search),
  );
  const stages = orderStages.map((stage) => ({
    ...stage,
    count: state.orders.filter((order) => order.status === stage.id).length,
    orders: matching.filter((order) => order.status === stage.id),
  }));
  return {
    ...state,
    total: state.orders.length,
    activeCount: state.orders.filter((order) => order.status !== "done").length,
    stages: stages.filter(
      (stage) => state.filter === "all" || state.filter === stage.id,
    ),
    allStages: stages,
    setSearch: store.setSearch,
    setFilter: store.setFilter,
    advance: store.advance,
    assignCourier: store.assignCourier,
    teamError: team.error,
    retryTeam: team.retry,
    deliveryCouriers: (team.ready ? state.couriers : []).map((courier) => ({
      ...courier,
      busy: state.orders.some(
        (order) =>
          order.status === "delivery" && order.courierId === courier.id,
      ),
    })),
  };
}
