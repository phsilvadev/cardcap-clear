import type { ReactNode } from "react";

export const manageTeamUrl = "/dashboard?view=settings&section=employees";

export function TeamHeading({
  title,
  description,
  eyebrow,
}: {
  title: string;
  description: string;
  eyebrow: string;
}) {
  return (
    <header className="dashboard-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <a className="button primary" href={manageTeamUrl}>
        Gerenciar funcionários <span aria-hidden="true">↗</span>
      </a>
    </header>
  );
}
export function TeamSummary({
  items,
  loading,
}: {
  items: { label: string; value: number }[];
  loading: boolean;
}) {
  return (
    <div
      className="team-summary"
      aria-label="Resumo da equipe"
      aria-busy={loading}
    >
      {items.map((item) => (
        <div key={item.label}>
          <strong>{loading ? "—" : item.value}</strong>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
export function TeamSkeleton() {
  return (
    <div className="team-skeleton" role="status">
      <span className="sr-only">Carregando equipe</span>
      {[0, 1, 2].map((item) => (
        <div className="team-skeleton-row" aria-hidden="true" key={item}>
          <span className="team-skeleton-avatar" />
          <div>
            <span />
            <span />
          </div>
          <span className="team-skeleton-pill" />
        </div>
      ))}
    </div>
  );
}
export function TeamEmpty({
  title,
  children,
  filtered,
  clear,
}: {
  title: string;
  children: ReactNode;
  filtered?: boolean;
  clear?: () => void;
}) {
  return (
    <div className="team-empty">
      <div className="team-empty-icon" aria-hidden="true">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.87" />
          <circle cx="9" cy="7" r="4" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      </div>
      <h2>{title}</h2>
      <p>{children}</p>
      {filtered ? (
        <button className="button" type="button" onClick={clear}>
          Limpar filtros
        </button>
      ) : (
        <a className="button primary" href={manageTeamUrl}>
          Cadastrar funcionário
        </a>
      )}
    </div>
  );
}
export function TeamPerson({
  name,
  children,
}: {
  name: string;
  children: ReactNode;
}) {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase("pt-BR");
  return (
    <div className="team-person">
      <span className="team-avatar" aria-hidden="true">
        {initials}
      </span>
      <div>
        <h2>{name}</h2>
        {children}
      </div>
    </div>
  );
}
