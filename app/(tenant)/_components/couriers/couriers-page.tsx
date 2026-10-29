"use client";
import {
  useCouriers,
  courierVehicles,
} from "@/app/(tenant)/_hooks/use-couriers";
const stateLabels = {
  available: "Disponível",
  delivering: "Em entrega",
  unavailable: "Indisponível",
};
const phone = (value: string) =>
  value.replace(/^(\d{2})(\d{4,5})(\d{4})$/, "($1) $2-$3");
export default function CouriersPage({
  tenantSlug,
  storeId,
}: {
  tenantSlug: string;
  storeId: string;
}) {
  const control = useCouriers(tenantSlug, storeId);
  return (
    <>
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">Equipe de entregas</p>
          <h1>Entregadores</h1>
          <p>Organize a equipe, a disponibilidade e os pedidos atribuídos.</p>
        </div>
        <a
          className="button primary"
          href="/dashboard?view=settings&section=employees"
        >
          Gerenciar funcionários
        </a>
      </div>
      <p className="couriers-preview-note">
        Equipe vinculada aos funcionários ativos com cargo Entregador.
        Disponibilidade e atribuições ficam nesta sessão do navegador.
      </p>
      <div className="couriers-summary">
        <span>
          <strong>{control.total}</strong> cadastrados
        </span>
        <span>
          <strong>{control.available}</strong> disponíveis
        </span>
        <span>
          <strong>{control.delivering}</strong> em entrega
        </span>
      </div>
      <div className="couriers-toolbar">
        <label className="search-label" htmlFor="courier-search">
          Buscar entregador
          <input
            id="courier-search"
            type="search"
            placeholder="Nome ou telefone"
            value={control.search}
            onChange={(event) => control.setSearch(event.target.value)}
          />
        </label>
        <label className="search-label" htmlFor="courier-filter">
          Disponibilidade
          <select
            id="courier-filter"
            value={control.filter}
            onChange={(event) => control.setFilter(event.target.value)}
          >
            <option value="all">Todos</option>
            <option value="available">Disponíveis</option>
            <option value="delivering">Em entrega</option>
            <option value="unavailable">Indisponíveis</option>
          </select>
        </label>
      </div>
      <p className="couriers-feedback" role="status" aria-live="polite">
        {control.message}
      </p>
      {control.error ? (
        <p role="alert">
          {control.error}{" "}
          <button type="button" className="text-button" onClick={control.retry}>
            Tentar novamente
          </button>
        </p>
      ) : !control.ready ? (
        <p role="status">Carregando equipe…</p>
      ) : !control.total ? (
        <div className="couriers-empty">
          <h2>Monte sua equipe de entregas</h2>
          <p>
            Em Funcionários, adicione uma pessoa com cargo Entregador. Ela
            aparecerá aqui automaticamente enquanto estiver ativa.
          </p>
          <a
            className="button primary"
            href="/dashboard?view=settings&section=employees"
          >
            Ir para Funcionários
          </a>
        </div>
      ) : !control.visible.length ? (
        <p className="couriers-empty">
          Nenhum entregador encontrado com esses filtros.
        </p>
      ) : (
        <div className="couriers-list">
          {control.visible.map((courier) => (
            <article className="courier-row" key={courier.id}>
              <div className="courier-person">
                <span className="courier-avatar" aria-hidden="true">
                  {courier.name[0].toLocaleUpperCase("pt-BR")}
                </span>
                <div>
                  <h2>{courier.name}</h2>
                  <a href={`tel:+55${courier.phone}`}>{phone(courier.phone)}</a>
                </div>
              </div>
              <div className="courier-transport">
                <span>Veículo</span>
                <strong>{courierVehicles[courier.vehicle]}</strong>
              </div>
              <div className="courier-assigned">
                <span>Pedidos atribuídos</span>
                {courier.assigned.length ? (
                  courier.assigned.map((order) => (
                    <a
                      key={order.id}
                      href={`/dashboard?view=orders&pedido=${encodeURIComponent(order.id)}`}
                    >
                      #{order.id} · {order.customer}
                    </a>
                  ))
                ) : (
                  <strong>Nenhum em andamento</strong>
                )}
              </div>
              <span className="courier-status" data-state={courier.state}>
                {stateLabels[courier.state]}
              </span>
              <div className="courier-actions">
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => control.toggle(courier.id)}
                  aria-label={`${courier.available ? "Indisponibilizar" : "Disponibilizar"} ${courier.name}`}
                >
                  {courier.available ? "Indisponibilizar" : "Disponibilizar"}
                </button>
                <a
                  className="button secondary"
                  href="/dashboard?view=settings&section=employees"
                >
                  Gerenciar cadastro
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
