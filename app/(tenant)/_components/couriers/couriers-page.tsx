"use client";
import {
  useCouriers,
  courierVehicles,
} from "@/app/(tenant)/_hooks/use-couriers";
import {
  TeamHeading,
  TeamSummary,
  TeamSkeleton,
  TeamEmpty,
  TeamPerson,
  manageTeamUrl,
} from "../team/team-directory";
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
    <div className="team-page">
      <TeamHeading
        title="Entregadores"
        eyebrow="Equipe de entregas"
        description="Veja quem está disponível e acompanhe os pedidos atribuídos."
      />
      <TeamSummary
        loading={!control.ready && !control.error}
        items={[
          {
            label: "Entregadores",
            value: control.total,
            description: "Funcionários ativos na equipe",
            icon: "truck",
            tone: "brand",
            selected: control.filter === "all",
            onClick: () => control.setFilter("all"),
          },
          {
            label: "Disponíveis",
            value: control.available,
            description: "Disponíveis para novas entregas",
            icon: "check",
            tone: "green",
            selected: control.filter === "available",
            onClick: () => control.setFilter("available"),
          },
          {
            label: "Em entrega",
            value: control.delivering,
            description: "Com pedidos a caminho do cliente",
            icon: "route",
            tone: "blue",
            selected: control.filter === "delivering",
            onClick: () => control.setFilter("delivering"),
          },
        ]}
      />
      <section className="team-directory" aria-label="Equipe de entregas">
        <div className="team-toolbar">
          <label className="search-label" htmlFor="courier-search">
            Buscar entregador
            <input
              id="courier-search"
              type="search"
              maxLength={100}
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
              <option value="all">Todos os entregadores</option>
              <option value="available">Disponíveis</option>
              <option value="delivering">Em entrega</option>
              <option value="unavailable">Indisponíveis</option>
            </select>
          </label>
        </div>
        <p className="team-feedback" role="status" aria-live="polite">
          {control.message}
        </p>
        {control.error ? (
          <div className="team-error" role="alert">
            <p>{control.error}</p>
            <button className="button" type="button" onClick={control.retry}>
              Tentar novamente
            </button>
          </div>
        ) : !control.ready ? (
          <TeamSkeleton />
        ) : !control.total ? (
          <TeamEmpty title="Monte sua equipe de entregas">
            Cadastre um funcionário com cargo Entregador. Os funcionários ativos
            aparecerão aqui.
          </TeamEmpty>
        ) : !control.visible.length ? (
          <TeamEmpty
            filtered
            clear={() => {
              control.setSearch("");
              control.setFilter("all");
            }}
            title="Nenhum entregador encontrado"
          >
            Tente outro nome ou altere o filtro de disponibilidade.
          </TeamEmpty>
        ) : (
          <>
            <div
              className="team-column-head team-courier-grid"
              aria-hidden="true"
            >
              <span>Entregador</span>
              <span>Veículo</span>
              <span>Pedidos em andamento</span>
              <span>Disponibilidade</span>
              <span />
            </div>
            <div className="team-rows">
              {control.visible.map((courier) => (
                <article
                  className="team-row team-courier-grid"
                  key={courier.id}
                  aria-label={courier.name}
                >
                  <TeamPerson name={courier.name}>
                    {courier.phone ? (
                      <a href={`tel:+55${courier.phone}`}>
                        {phone(courier.phone)}
                      </a>
                    ) : (
                      <p>Telefone não informado</p>
                    )}
                  </TeamPerson>
                  <div className="team-vehicle">
                    <span className="team-mobile-label">Veículo</span>
                    {courierVehicles[courier.vehicle]}
                  </div>
                  <div className="team-assigned">
                    <span className="team-mobile-label">
                      Pedidos em andamento
                    </span>
                    {courier.assigned.length ? (
                      courier.assigned.map((order) => (
                        <a
                          key={order.id}
                          href={`/dashboard/pedidos?pedido=${encodeURIComponent(order.id)}`}
                        >
                          #{order.id} <span>· {order.customer}</span>
                        </a>
                      ))
                    ) : (
                      <span className="team-muted">
                        Nenhum pedido atribuído
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="team-badge" data-state={courier.state}>
                      {stateLabels[courier.state]}
                    </span>
                  </div>
                  <details className="team-row-actions">
                    <summary aria-label={`Ações para ${courier.name}`}>
                      Ações <span aria-hidden="true">⌄</span>
                    </summary>
                    <div>
                      <button
                        type="button"
                        onClick={() => control.toggle(courier.id)}
                      >
                        {courier.available
                          ? "Marcar indisponível"
                          : "Marcar disponível"}
                      </button>
                      <a href={manageTeamUrl}>Gerenciar funcionário ↗</a>
                    </div>
                  </details>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
      <p className="team-footnote">
        A disponibilidade é uma prévia local deste navegador. Os pedidos
        atribuídos vêm do painel da loja. Gerencie cadastros e acessos em
        Funcionários.
      </p>
    </div>
  );
}
