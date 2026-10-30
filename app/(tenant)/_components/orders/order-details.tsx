"use client";
import { useState, type FormEvent } from "react";
import type { DashboardOrder, DeliveryCourier } from "@/lib/types";
import { orderStages } from "@/lib/orders/demo-store";
import { formatProductPrice } from "@/lib/menu/product-validation";
export default function OrderDetails({
  order,
  onAdvance,
  onCancel,
  couriers,
  onAssign,
  ownDelivery,
  busy = false,
}: {
  order: DashboardOrder;
  onAdvance: (id: string) => void;
  onCancel: (id: string, reason: string) => Promise<boolean>;
  busy?: boolean;
  couriers: (DeliveryCourier & { busy: boolean })[];
  onAssign: (orderId: string, courierId: string) => void;
  ownDelivery: boolean;
}) {
  const stage = orderStages.find((item) => item.id === order.status)!;
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  async function cancel(event: FormEvent) {
    event.preventDefault();
    if (reason.trim().length < 3) {
      setError("Informe o motivo do cancelamento.");
      return;
    }
    if (!(await onCancel(order.id, reason)))
      setError(
        "Não foi possível cancelar. Confira o motivo e tente novamente.",
      );
  }
  return (
    <article
      className="order-details"
      aria-label={`Detalhes do pedido #${order.id}`}
    >
      <header className="order-details-header">
        <div>
          <p className="eyebrow">Detalhes do pedido</p>
          <h2>Pedido #{order.id}</h2>
          <p>Recebido {order.time.toLocaleLowerCase("pt-BR")}</p>
        </div>
        <span className="orders-status" data-status={order.status}>
          {stage.label}
        </span>
      </header>
      {order.status !== "cancelled" && (
        <ol
          className="order-details-progress"
          aria-label="Etapas do atendimento"
        >
          {orderStages
            .filter((item) => item.id !== "cancelled")
            .map((item, index) => (
              <li
                key={item.id}
                data-current={order.status === item.id}
                aria-current={order.status === item.id ? "step" : undefined}
              >
                <span>{index + 1}</span>
                {item.label}
              </li>
            ))}
        </ol>
      )}
      <section className="order-details-section">
        <h3>Cliente</h3>
        <strong className="order-details-customer">{order.customer}</strong>
      </section>
      <section className="order-details-section">
        <h3>Itens do pedido</h3>
        <ul className="order-details-items">
          {order.items.split(" · ").map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
        <div className="order-details-total">
          <span>Total do pedido</span>
          <strong>{formatProductPrice(order.total)}</strong>
        </div>
      </section>
      {ownDelivery && ["preparing", "delivery"].includes(order.status) && (
        <section className="order-details-section">
          <label
            className="search-label"
            htmlFor={`detail-courier-${order.id}`}
          >
            Entregador
            <select
              id={`detail-courier-${order.id}`}
              disabled={busy}
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
          </label>
          {!couriers.length && (
            <a
              className="text-button"
              href="/dashboard?view=settings&section=employees"
            >
              Gerenciar equipe ↗
            </a>
          )}
        </section>
      )}
      {order.status === "cancelled" && (
        <section className="order-details-section">
          <h3>Motivo do cancelamento</h3>
          <p>{order.cancellationReason ?? "Motivo não informado."}</p>
        </section>
      )}
      {order.status === "done" && (
        <p className="order-details-completed">
          Pedido concluído
          {order.courierName ? ` · Entregador: ${order.courierName}` : ""}.
        </p>
      )}
      {stage.action && !cancelling && (
        <footer className="order-details-actions">
          <button
            type="button"
            disabled={busy}
            className="button order-details-cancel"
            onClick={() => setCancelling(true)}
          >
            Cancelar pedido
          </button>
          <button
            type="button"
            disabled={busy}
            className="button primary"
            aria-label={`${stage.action} #${order.id}`}
            onClick={() => onAdvance(order.id)}
          >
            {stage.action}
            <span aria-hidden="true"> →</span>
          </button>
        </footer>
      )}
      {cancelling && (
        <form className="order-cancel-form" onSubmit={cancel}>
          <h3>Cancelar pedido #{order.id}?</h3>
          <p>Confirme o motivo antes de encerrar este pedido.</p>
          <label className="search-label" htmlFor="order-cancellation-reason">
            Motivo do cancelamento
            <textarea
              id="order-cancellation-reason"
              autoFocus
              required
              minLength={3}
              maxLength={300}
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                setError("");
              }}
              placeholder="Ex.: item indisponível"
            />
          </label>
          {error && <p role="alert">{error}</p>}
          <div className="order-details-actions">
            <button
              className="button"
              type="button"
              onClick={() => setCancelling(false)}
            >
              Manter pedido
            </button>
            <button
              disabled={busy}
              className="button order-details-cancel"
              type="submit"
            >
              Confirmar cancelamento
            </button>
          </div>
        </form>
      )}
    </article>
  );
}
