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
type TeamMetric = {
  label: string;
  value: number;
  description: string;
  icon: "team" | "check" | "key" | "truck" | "route";
  tone: "brand" | "green" | "amber" | "blue";
  selected: boolean;
  onClick: () => void;
};
function MetricIcon({ icon }: { icon: TeamMetric["icon"] }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icon === "team" ? (
        <>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.87" />
          <circle cx="9" cy="7" r="4" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </>
      ) : icon === "check" ? (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="m8 12 3 3 5-6" />
        </>
      ) : icon === "key" ? (
        <>
          <circle cx="8" cy="15" r="5" />
          <path d="m11.5 11.5 8-8L22 6l-2 2-2-2-3 3" />
        </>
      ) : icon === "truck" ? (
        <>
          <path d="M1 3h14v13H1zM15 8h4l3 4v4h-7" />
          <circle cx="5" cy="18" r="2" />
          <circle cx="18" cy="18" r="2" />
        </>
      ) : (
        <>
          <circle cx="6" cy="5" r="2" />
          <circle cx="18" cy="19" r="2" />
          <path d="M8 5h9a4 4 0 0 1 0 8H7a3 3 0 0 0 0 6h9" />
        </>
      )}
    </svg>
  );
}
export function TeamSummary({
  items,
  loading,
}: {
  items: TeamMetric[];
  loading: boolean;
}) {
  return (
    <div
      className="team-summary"
      role="group"
      aria-label="Indicadores e filtros da equipe"
      aria-busy={loading}
    >
      {items.map((item) => (
        <button
          className="team-metric"
          data-tone={item.tone}
          type="button"
          key={item.label}
          disabled={loading}
          title={item.description}
          aria-pressed={item.selected}
          onClick={item.onClick}
        >
          <span className="team-metric-top">
            <span className="team-metric-label">{item.label}</span>
            <span className="team-metric-icon">
              <MetricIcon icon={item.icon} />
            </span>
          </span>
          {loading ? (
            <span
              className="team-metric-loading"
              aria-label="Carregando indicador"
            />
          ) : (
            <strong className="team-metric-value">{item.value}</strong>
          )}
        </button>
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
