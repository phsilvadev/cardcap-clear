"use client";
import { useDashboardOrders } from "@/app/(tenant)/_hooks/use-dashboard-orders";
import { formatProductPrice } from "@/lib/menu/product-validation";
import OrderAutomation from "../orders/order-automation";
import OrderDetails from "../orders/order-details";
import { useStoreOperations } from "./operations-provider";
export default function DashboardOrders({
  tenantSlug,
  storeId,
}: {
  tenantSlug: string;
  storeId?: string;
}) {
  const orders = useDashboardOrders(tenantSlug, storeId);
  const { operations } = useStoreOperations();
  return (
    <section id="view-orders" className="dashboard-view " aria-label="Pedidos">
      <div className="orders-workspace ">
        <aside className="orders-inbox" aria-label="Lista de pedidos">
          <div className="orders-inbox-heading">
            <h2>Pedidos</h2>
            <span>{orders.activeCount} em andamento</span>
          </div>
          <OrderAutomation />
          <div className="orders-inbox-filters">
            <label className="search-label" htmlFor="order-query">
              <span className="sr-only">Buscar pedido</span>
              <svg
                className="orders-search-icon"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m16 16 4 4" />
              </svg>
              <input
                id="order-query"
                type="search"
                placeholder="Buscar pedido"
                maxLength={100}
                value={orders.search}
                onChange={(event) => orders.setSearch(event.target.value)}
              />
            </label>
            <label className="search-label" htmlFor="order-stage-filter">
              <span className="sr-only">Filtrar por status</span>
              <select
                id="order-stage-filter"
                value={orders.filter}
                onChange={(event) =>
                  orders.setFilter(event.target.value as typeof orders.filter)
                }
              >
                <option value="all">Filtros</option>
                {orders.allStages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.label} ({stage.count})
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="orders-inbox-list" id="orders-list">
            {orders.stages
              .filter((stage) => stage.orders.length)
              .map((stage) => (
                <section
                  key={stage.id}
                  aria-labelledby={`orders-stage-${stage.id}`}
                >
                  <div className="orders-inbox-stage">
                    <h3 id={`orders-stage-${stage.id}`}>{stage.label}</h3>
                    <span>{stage.orders.length}</span>
                  </div>
                  {stage.orders.map((order) => (
                    <button
                      type="button"
                      className="orders-inbox-item"
                      key={order.id}
                      aria-pressed={orders.selected?.id === order.id}
                      onClick={() => orders.select(order.id)}
                      aria-label={`Ver pedido #${order.id}, ${order.customer}`}
                    >
                      <span className="orders-inbox-item-top">
                        <strong>#{order.id}</strong>
                        <span>{order.time}</span>
                      </span>
                      <strong className="orders-inbox-customer">
                        {order.customer}
                      </strong>
                      <span className="orders-inbox-items">{order.items}</span>
                      <span className="orders-inbox-item-bottom">
                        <span
                          className="orders-status"
                          data-status={order.status}
                        >
                          {stage.label}
                        </span>
                        <strong>{formatProductPrice(order.total)}</strong>
                      </span>
                    </button>
                  ))}
                </section>
              ))}
            {orders.loading && (
              <p className="orders-inbox-empty" role="status">
                Carregando pedidos…
              </p>
            )}
            {orders.hasMore && (
              <button
                className="text-button"
                type="button"
                onClick={orders.loadMore}
              >
                Carregar mais pedidos
              </button>
            )}
            {!orders.loading &&
              !orders.stages.some((stage) => stage.orders.length) && (
                <p className="orders-inbox-empty">
                  Nenhum pedido encontrado. Tente outra busca ou status.
                </p>
              )}
          </div>
        </aside>
        <div className="orders-detail-pane">
          {orders.error && (
            <p role="alert">
              {orders.error}{" "}
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  void orders.refresh();
                }}
              >
                Tentar novamente
              </button>
            </p>
          )}
          <p
            className="orders-workspace-feedback"
            role="status"
            aria-live="polite"
          >
            {orders.message}
          </p>
          {operations.ownDelivery && orders.teamError && (
            <p role="alert">
              Equipe de entregas: {orders.teamError}{" "}
              <button
                className="text-button"
                type="button"
                onClick={orders.retryTeam}
              >
                Tentar novamente
              </button>
            </p>
          )}
          {orders.selected ? (
            <OrderDetails
              key={`${orders.selected.id}-${orders.selected.status}`}
              order={orders.selected}
              onAdvance={orders.advance}
              onCancel={orders.cancel}
              couriers={orders.deliveryCouriers}
              onAssign={orders.assignCourier}
              ownDelivery={operations.ownDelivery}
              busy={orders.busy}
            />
          ) : (
            <div className="orders-detail-empty">
              <h2>Selecione um pedido</h2>
              <p>Os detalhes e as ações de atendimento aparecerão aqui.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
