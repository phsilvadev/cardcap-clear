"use client";
import { useEmployees } from "@/app/(tenant)/_hooks/use-employees";
export default function WaitersPage({ storeId }: { storeId: string }) {
  const team = useEmployees(storeId, true);
  const waiters = team.employees.filter(
    (employee) => employee.role === "waiter",
  );
  return (
    <div className="waiters-page">
      <header className="dashboard-heading">
        <div>
          <p className="eyebrow">Sua equipe. Cada atendimento.</p>
          <h1>Garçons</h1>
          <p>Acompanhe a equipe de atendimento do salão.</p>
        </div>
        <a
          className="button primary"
          href="/dashboard?view=settings&section=employees"
        >
          Gerenciar funcionários
        </a>
      </header>
      {team.loading ? (
        <p role="status">Carregando equipe…</p>
      ) : team.loadError ? (
        <div role="alert">
          <p>{team.loadError}</p>
          <button type="button" onClick={team.retry}>
            Tentar novamente
          </button>
        </div>
      ) : (
        <section className="operations-roster" aria-label="Equipe do salão">
          {!waiters.length && (
            <p>
              Nenhum garçom encontrado nesta página da equipe. Cadastre o cargo
              Garçom em Funcionários.
            </p>
          )}
          {waiters.map((employee) => (
            <article key={employee.id}>
              <div>
                <strong>{employee.name}</strong>
                <p>{employee.email}</p>
              </div>
              <span>{employee.active ? "Ativo" : "Inativo"}</span>
              <span>
                {employee.invited
                  ? "Acesso ao app liberado"
                  : "Acesso ao app pendente"}
              </span>
            </article>
          ))}
          {team.hasMore && (
            <button
              type="button"
              className="button"
              disabled={team.busy === "more"}
              onClick={team.loadMore}
            >
              Carregar mais funcionários
            </button>
          )}
          {team.error && <p role="alert">{team.error}</p>}
        </section>
      )}
    </div>
  );
}
