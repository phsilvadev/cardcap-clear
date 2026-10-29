"use client";
import { useDashboardOrders } from "@/app/(tenant)/_hooks/use-dashboard-orders";
import OrderCard from "@/app/(tenant)/_components/orders/order-card";

export default function DashboardOrders({
  tenantSlug,
}: {
  tenantSlug: string;
}) {
  const orders = useDashboardOrders(tenantSlug);
  return (
    <section
      id="view-orders"
      className="dashboard-view"
      aria-label="Pedidos"
      hidden
    >
      <div className="incoming-orders-heading">
        <p>
          {orders.total} pedidos · {orders.activeCount} em andamento
        </p>
      </div>
      <div
        className="incoming-orders-filters"
        role="group"
        aria-label="Filtrar por etapa"
      >
        <button
          type="button"
          aria-pressed={orders.filter === "all"}
          onClick={() => orders.setFilter("all")}
        >
          Todos<span>{orders.total}</span>
        </button>
        {orders.allStages.map((stage) => (
          <button
            type="button"
            key={stage.id}
            data-stage={stage.id}
            aria-pressed={orders.filter === stage.id}
            onClick={() => orders.setFilter(stage.id)}
          >
            {stage.label}
            <span>{stage.count}</span>
          </button>
        ))}
      </div>
      <div className="incoming-orders-search">
        <label className="search-label" htmlFor="order-query">
          Buscar pedido
          <input
            id="order-query"
            type="search"
            placeholder="Nome do cliente, número ou item do pedido"
            maxLength={100}
            value={orders.search}
            onChange={(event) => orders.setSearch(event.target.value)}
          />
        </label>
      </div>
      <p className="incoming-orders-feedback" role="status" aria-live="polite">
        {orders.message}
      </p>
      <div
        className={`incoming-orders-board${orders.filter !== "all" ? " is-filtered" : ""}`}
        id="orders-list"
      >
        {orders.stages.map((stage) => (
          <section
            className="incoming-orders-column"
            data-stage={stage.id}
            key={stage.id}
            aria-labelledby={`orders-stage-${stage.id}`}
          >
            <div className="incoming-column-heading">
              <div>
                <h3 id={`orders-stage-${stage.id}`}>
                  <span className="order-stage-dot" aria-hidden="true" />
                  {stage.label}
                </h3>
                <p>{stage.description}</p>
              </div>
              <span
                className="incoming-column-count"
                aria-label={`${stage.orders.length} pedidos nesta etapa`}
              >
                {stage.orders.length}
              </span>
            </div>
            <div className="incoming-column-cards">
              {stage.orders.length ? (
                stage.orders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onAdvance={orders.advance}
                    couriers={orders.deliveryCouriers}
                    onAssign={orders.assignCourier}
                  />
                ))
              ) : (
                <p className="incoming-orders-empty">
                  {orders.search.trim()
                    ? "Nenhum pedido encontrado nesta etapa."
                    : stage.id === "new"
                      ? "Nenhum pedido aguardando confirmação."
                      : "Nenhum pedido nesta etapa."}
                </p>
              )}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
