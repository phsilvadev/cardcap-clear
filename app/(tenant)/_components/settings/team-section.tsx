"use client";
import { useEmployees } from "@/app/(tenant)/_hooks/use-employees";
import { employeeRoles } from "@/lib/employees/types";
import EmployeeDialogs from "@/app/(tenant)/_components/employees/employee-dialogs";

export default function TeamSection({
  storeId,
  enabled,
}: {
  storeId?: string;
  enabled: boolean;
}) {
  const control = useEmployees(storeId, enabled);
  return (
    <div className="employees-section">
      <div className="employees-header">
        <div>
          <h3>Acesso da equipe</h3>
          <p>Cadastre funcionários e gerencie o vínculo com seu restaurante.</p>
        </div>
        <button
          type="button"
          className="button primary"
          disabled={
            control.loading ||
            Boolean(control.loadError) ||
            !control.canManage ||
            Boolean(control.busy)
          }
          onClick={control.openForm}
        >
          Adicionar funcionário <span aria-hidden="true">+</span>
        </button>
      </div>
      <p className="employees-access-note">
        As alterações nesta seção são aplicadas à equipe real da sua loja no
        Anow. O login de funcionários neste painel ainda não está integrado; o
        acesso ao painel continua restrito ao proprietário.
      </p>
      {!control.loading && !control.loadError && !control.canManage && (
        <p className="employees-access-note">
          Conclua o cadastro da loja para adicionar, ativar ou remover
          funcionários.
        </p>
      )}
      <div className="employees-filters">
        <label className="search-label" htmlFor="employee-search">
          Buscar funcionário
          <input
            id="employee-search"
            type="search"
            value={control.search}
            onChange={(event) => control.setSearch(event.target.value)}
            placeholder="Nome ou e-mail"
            maxLength={254}
          />
        </label>
        <label className="search-label" htmlFor="employee-filter">
          Situação
          <select
            id="employee-filter"
            value={control.status}
            onChange={(event) => control.setStatus(event.target.value)}
          >
            <option value="all">Todos</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
        </label>
      </div>
      {control.notice && (
        <p className="employees-message" role="status">
          {control.notice}
        </p>
      )}
      {control.error &&
        !control.formOpen &&
        !control.removing &&
        !control.credentials && (
          <p className="employees-error" role="alert">
            {control.error}
          </p>
        )}
      {control.loading ? (
        <div role="status">
          <span className="sr-only">Carregando funcionários…</span>
          {[0, 1, 2].map((index) => (
            <div
              className="employee-row employee-row-skeleton"
              key={index}
              aria-hidden="true"
            >
              <span className="menu-skeleton-block employee-avatar" />
              <div className="employee-copy">
                <span className="menu-skeleton-block employee-skeleton-name" />
                <span className="menu-skeleton-block employee-skeleton-email" />
              </div>
              <span className="menu-skeleton-block employee-skeleton-action" />
            </div>
          ))}
        </div>
      ) : control.loadError ? (
        <div className="employees-empty">
          <p role="alert">{control.loadError}</p>
          <button
            type="button"
            className="button secondary"
            onClick={control.retry}
          >
            Tentar novamente
          </button>
        </div>
      ) : !control.employees.length ? (
        <div className="employees-empty">
          <h4>Sua equipe começa aqui</h4>
          <p>Nenhum funcionário cadastrado nesta loja.</p>
          {control.canManage && (
            <button
              type="button"
              className="button secondary"
              onClick={control.openForm}
            >
              Cadastrar primeiro funcionário
            </button>
          )}
        </div>
      ) : !control.visible.length ? (
        <p className="employees-empty">
          Nenhum funcionário encontrado nos itens carregados.
        </p>
      ) : (
        <div className="employees-list">
          {control.visible.map((employee) => (
            <article className="employee-row" key={employee.id}>
              <span className="employee-avatar" aria-hidden="true">
                {employee.name[0].toLocaleUpperCase("pt-BR")}
              </span>
              <div className="employee-copy">
                <h4>{employee.name}</h4>
                <p>{employee.email}</p>
              </div>
              <span className="employee-role">
                {employeeRoles[employee.role]}
              </span>
              <span className="employee-status" data-active={employee.active}>
                {employee.active ? "Ativo" : "Inativo"}
              </span>
              <div className="employee-actions">
                {employee.invited && employee.active && (
                  <button
                    type="button"
                    className="button secondary"
                    disabled={!control.canManage || Boolean(control.busy)}
                    onClick={() => control.resend(employee)}
                    aria-label={`Reenviar acesso para ${employee.name}`}
                  >
                    Reenviar acesso
                  </button>
                )}
                <button
                  type="button"
                  className="button secondary"
                  disabled={!control.canManage || Boolean(control.busy)}
                  onClick={() => control.toggle(employee)}
                  aria-label={`${employee.active ? "Desativar" : "Ativar"} ${employee.name}`}
                >
                  {employee.active ? "Desativar" : "Ativar"}
                </button>
                <button
                  type="button"
                  className="button danger"
                  disabled={!control.canManage || Boolean(control.busy)}
                  onClick={() => control.askRemove(employee)}
                  aria-label={`Remover ${employee.name}`}
                >
                  Remover
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      {!control.loading && !control.loadError && control.hasMore && (
        <button
          type="button"
          className="button secondary"
          disabled={Boolean(control.busy)}
          onClick={control.loadMore}
        >
          {control.busy === "more"
            ? "Carregando…"
            : "Carregar mais funcionários"}
        </button>
      )}
      <EmployeeDialogs control={control} />
    </div>
  );
}
