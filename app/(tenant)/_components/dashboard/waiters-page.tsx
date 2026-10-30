"use client";
import { useWaiters } from "@/app/(tenant)/_hooks/use-waiters";
import {
  TeamHeading,
  TeamSummary,
  TeamSkeleton,
  TeamEmpty,
  TeamPerson,
  manageTeamUrl,
} from "../team/team-directory";
export default function WaitersPage({ storeId }: { storeId: string }) {
  const team = useWaiters(storeId);
  return (
    <div className="team-page">
      <TeamHeading
        title="Garçons"
        eyebrow="Equipe do salão"
        description="Acompanhe os funcionários e os acessos ao app do garçom."
      />
      <a href="/dashboard/salao" className="button">
        Abrir salão e contas
      </a>
      <TeamSummary
        loading={team.loading}
        items={[
          {
            label: "Garçons",
            value: team.total,
            description: team.hasMore
              ? "Na equipe carregada até agora"
              : "Cadastrados na equipe do salão",
            icon: "team",
            tone: "brand",
            selected: team.filter === "all",
            onClick: () => team.setFilter("all"),
          },
          {
            label: "Ativos",
            value: team.active,
            description: "Cadastro ativo no restaurante",
            icon: "check",
            tone: "green",
            selected: team.filter === "active",
            onClick: () => team.setFilter("active"),
          },
          {
            label: "Acesso pendente",
            value: team.pending,
            description: "Aguardando liberação do aplicativo",
            icon: "key",
            tone: "amber",
            selected: team.filter === "pending",
            onClick: () => team.setFilter("pending"),
          },
        ]}
      />
      <section className="team-directory" aria-label="Equipe do salão">
        <div className="team-toolbar">
          <label className="search-label" htmlFor="waiter-search">
            Buscar garçom
            <input
              id="waiter-search"
              type="search"
              maxLength={100}
              placeholder="Nome ou e-mail"
              value={team.search}
              onChange={(event) => team.setSearch(event.target.value)}
            />
          </label>
          <label className="search-label" htmlFor="waiter-filter">
            Status
            <select
              id="waiter-filter"
              value={team.filter}
              onChange={(event) => team.setFilter(event.target.value)}
            >
              <option value="all">Todos os garçons</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
              <option value="pending">Acesso pendente</option>
            </select>
          </label>
        </div>
        {team.loading ? (
          <TeamSkeleton />
        ) : team.loadError ? (
          <div className="team-error" role="alert">
            <p>{team.loadError}</p>
            <button className="button" type="button" onClick={team.retry}>
              Tentar novamente
            </button>
          </div>
        ) : !team.total ? (
          <TeamEmpty title="Sua equipe de salão começa aqui">
            Cadastre um funcionário com cargo Garçom e libere o acesso ao
            aplicativo em Funcionários.
          </TeamEmpty>
        ) : !team.visible.length ? (
          <TeamEmpty
            filtered
            clear={team.clearFilters}
            title="Nenhum garçom encontrado"
          >
            Tente outro nome ou altere o filtro de status.
          </TeamEmpty>
        ) : (
          <>
            <div
              className="team-column-head team-waiter-grid"
              aria-hidden="true"
            >
              <span>Funcionário</span>
              <span>Cadastro</span>
              <span>Acesso ao aplicativo</span>
              <span />
            </div>
            <div className="team-rows">
              {team.visible.map((employee) => (
                <article
                  className="team-row team-waiter-grid"
                  key={employee.id}
                  aria-label={employee.name}
                >
                  <TeamPerson name={employee.name}>
                    <a href={`mailto:${employee.email}`}>{employee.email}</a>
                  </TeamPerson>
                  <div>
                    <span
                      className="team-badge"
                      data-state={employee.active ? "active" : "inactive"}
                    >
                      {employee.active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  <div className="team-access">
                    <span
                      className="team-access-dot"
                      data-ready={employee.invited && employee.active}
                    />
                    <span>
                      {!employee.active
                        ? "Acesso desativado"
                        : employee.invited
                          ? "Liberado"
                          : "Aguardando liberação"}
                    </span>
                  </div>
                  <a
                    className="button"
                    href={manageTeamUrl}
                    aria-label={`Gerenciar ${employee.name}`}
                  >
                    Gerenciar <span aria-hidden="true">↗</span>
                  </a>
                </article>
              ))}
            </div>
          </>
        )}
        {team.hasMore && !team.loading && (
          <div className="team-list-footer">
            <button
              className="button"
              type="button"
              disabled={team.busy === "more"}
              onClick={team.loadMore}
            >
              {team.busy === "more" ? "Carregando…" : "Carregar mais garçons"}
            </button>
          </div>
        )}
        {team.error && (
          <p className="team-error" role="alert">
            {team.error}
          </p>
        )}
      </section>
      <p className="team-footnote">
        Cadastros, liberação de acesso e alterações da equipe ficam em
        Funcionários.
      </p>
    </div>
  );
}
