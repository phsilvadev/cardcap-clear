import type { DashboardOrder, DeliveryCourier } from "@/lib/types";
import { orderStages } from "@/lib/orders/demo-store";
import { formatProductPrice } from "@/lib/menu/product-validation";
export default function OrderCard({
  order,
  onAdvance,
  couriers,
  onAssign,
}: {
  order: DashboardOrder;
  onAdvance: (id: string) => void;
  couriers: (DeliveryCourier & { busy: boolean })[];
  onAssign: (orderId: string, courierId: string) => void;
}) {
  const stage = orderStages.find((item) => item.id === order.status)!;
  return (
    <article
      className="incoming-order-card"
      aria-label={`Pedido ${order.id}, ${order.customer}`}
    >
      <div className="incoming-order-top">
        <strong>#{order.id}</strong>
        <span>{order.time}</span>
      </div>
      <h3>{order.customer}</h3>
      <p className="incoming-order-items">{order.items}</p>
      <div className="incoming-order-total">
        <span>Total do pedido</span>
        <strong>{formatProductPrice(order.total)}</strong>
      </div>
      {["preparing", "delivery"].includes(order.status) && (
        <label
          className="order-courier-field"
          htmlFor={`order-courier-${order.id}`}
        >
          Entregador
          <select
            id={`order-courier-${order.id}`}
            value={order.courierId ?? ""}
            onChange={(event) => onAssign(order.id, event.target.value)}
          >
            <option value="">Sem entregador atribuído</option>
            {couriers.map((courier) => (
              <option
                key={courier.id}
                value={courier.id}
                disabled={
                  (!courier.available || courier.busy) &&
                  courier.id !== order.courierId
                }
              >
                {courier.name}
                {!courier.available
                  ? " · Indisponível"
                  : courier.busy && courier.id !== order.courierId
                    ? " · Em entrega"
                    : ""}
              </option>
            ))}
            {order.courierId &&
              !couriers.some((courier) => courier.id === order.courierId) && (
                <option value={order.courierId}>
                  {order.courierName ?? "Entregador não encontrado"}
                </option>
              )}
          </select>
          {!couriers.length && (
            <a href="/dashboard?view=settings&section=employees">
              Gerenciar equipe ↗
            </a>
          )}
        </label>
      )}
      {order.status === "done" && order.courierName && (
        <p className="order-courier-completed">
          Entregador: {order.courierName}
        </p>
      )}
      {stage.action ? (
        <button
          type="button"
          className={`incoming-order-action ${order.status === "new" ? "primary" : ""}`}
          aria-label={`${stage.action} #${order.id}`}
          onClick={() => onAdvance(order.id)}
        >
          {stage.action}
          <span aria-hidden="true">→</span>
        </button>
      ) : (
        <span className="incoming-order-completed">
          <span aria-hidden="true">✓</span> Pedido concluído
        </span>
      )}
    </article>
  );
}
