"use client";
import { useCouriers } from "../../_hooks/use-couriers";
import { useTenantOrders } from "../orders/tenant-orders-provider";
import { formatProductPrice } from "@/lib/menu/product-validation";

export default function DeliveriesPage({
  tenantSlug,
  storeId,
}: {
  tenantSlug: string;
  storeId: string;
}) {
  const team = useCouriers(tenantSlug, storeId);
  const control = useTenantOrders();
  const orders = control.orders.filter(
    (order) =>
      order.source !== "salon" &&
      order.fulfillment !== "pickup" &&
      ["preparing", "delivery"].includes(order.status),
  );
  const waiting = orders.filter((order) => !order.courierId);
  const assigned = orders.filter(
    (order) => order.courierId && order.status === "preparing",
  );
  const delivering = orders.filter(
    (order) => order.status === "delivery" && order.courierId,
  );
  const columns = [
    {
      title: "Aguardando entregador",
      hint: "Defina quem fará a entrega",
      orders: waiting,
      tone: "amber",
    },
    {
      title: "Entregador atribuído",
      hint: "Em preparo para sair",
      orders: assigned,
      tone: "brand",
    },
    {
      title: "Em entrega",
      hint: "A caminho do cliente",
      orders: delivering,
      tone: "green",
    },
  ];
  return (
    <div className="team-page deliveries-page">
      <header className="dashboard-heading">
        <div>
          <p className="eyebrow">Operação de delivery</p>
          <h1>Entregas</h1>
          <p>Do pedido em preparo até a chegada ao cliente.</p>
        </div>
        <a
          className="button"
          href="/dashboard?view=settings&section=employees&role=courier"
        >
          Gerenciar entregadores ↗
        </a>
      </header>
      <div className="delivery-summary">
        {columns.map((column) => (
          <article key={column.title} data-tone={column.tone}>
            <span>{column.title}</span>
            <strong>{control.loading ? "—" : column.orders.length}</strong>
            <p>{column.hint}</p>
          </article>
        ))}
      </div>
      <div className="delivery-team-strip">
        <div>
          <strong>Equipe de entrega</strong>
          <p>
            {team.ready
              ? `${team.available} disponíveis · ${team.delivering} em entrega`
              : "Carregando disponibilidade…"}
          </p>
        </div>
        <a href="/dashboard?view=settings&section=employees&role=courier">
          Ver equipe →
        </a>
      </div>
      {(control.error || team.error) && (
        <div className="team-error" role="alert">
          <p>{control.error || team.error}</p>
          <button
            className="button"
            onClick={() => {
              void control.refresh();
              team.retry();
            }}
          >
            Tentar novamente
          </button>
        </div>
      )}
      {control.message && <p role="status">{control.message}</p>}
      {control.loading ? (
        <p role="status">Carregando entregas…</p>
      ) : (
        <div className="delivery-board">
          {columns.map((column) => (
            <section
              className="delivery-column"
              key={column.title}
              aria-label={column.title}
              data-tone={column.tone}
            >
              <header>
                <h2>{column.title}</h2>
                <span>{column.orders.length}</span>
              </header>
              {!column.orders.length && (
                <div className="delivery-empty">Nenhum pedido nesta etapa.</div>
              )}
              {column.orders.map((order) => (
                <article className="delivery-order" key={order.id}>
                  <div className="delivery-order-top">
                    <strong>#{order.id}</strong>
                    <span>{order.time}</span>
                  </div>
                  <h3>{order.customer}</h3>
                  <p>{order.items}</p>
                  <strong className="delivery-total">
                    {formatProductPrice(order.total)}
                  </strong>
                  <label htmlFor={`delivery-${order.id}`}>
                    Entregador
                    <select
                      id={`delivery-${order.id}`}
                      disabled={control.busy || !team.ready || !!team.error}
                      value={order.courierId ?? ""}
                      onChange={(event) =>
                        control.assign(order.id, event.target.value)
                      }
                    >
                      <option value="">Selecionar entregador</option>
                      {team.visible.map((courier) => (
                        <option
                          key={courier.id}
                          value={courier.id}
                          disabled={
                            (!courier.available ||
                              courier.assigned.some(
                                (other) => other.id !== order.id,
                              )) &&
                            courier.id !== order.courierId
                          }
                        >
                          {courier.name}
                        </option>
                      ))}
                      {order.courierId &&
                        !team.visible.some(
                          (courier) => courier.id === order.courierId,
                        ) && (
                          <option value={order.courierId}>
                            {order.courierName || "Entregador atribuído"}
                          </option>
                        )}
                    </select>
                  </label>
                  <a
                    className="delivery-detail"
                    href={`/dashboard/pedidos?pedido=${encodeURIComponent(order.id)}`}
                  >
                    Ver pedido ↗
                  </a>
                  <button
                    className="button primary"
                    disabled={control.busy || !order.courierId}
                    onClick={() =>
                      void control.transition(
                        order.id,
                        order.status === "preparing" ? "delivery" : "done",
                      )
                    }
                  >
                    {order.status === "preparing"
                      ? "Saiu para entrega →"
                      : "Concluir entrega ✓"}
                  </button>
                </article>
              ))}
            </section>
          ))}
        </div>
      )}
      {control.hasMore && (
        <button
          className="button"
          disabled={control.loading || control.busy}
          onClick={control.loadMore}
        >
          Carregar mais pedidos
        </button>
      )}
      <p className="team-footnote">
        Indicadores referentes aos pedidos carregados. A disponibilidade da
        equipe usa a prévia deste navegador.
      </p>
    </div>
  );
}
