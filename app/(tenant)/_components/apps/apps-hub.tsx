"use client";
import { useStoreOperations } from "../dashboard/operations-provider";
type AppId = "waiter" | "courier" | "printing";
const apps = [
  {
    id: "waiter",
    title: "Cardap Garçom",
    platform: "Celular",
    description: "O atendimento do salão na mão da sua equipe.",
    features: ["Mesas e pedidos do salão", "Solicitação de conta ao caixa"],
    icon: "waiter",
  },
  {
    id: "courier",
    title: "Cardap Entregador",
    platform: "Celular",
    description: "Da retirada ao cliente, acompanhe cada entrega.",
    features: [
      "Entregas atribuídas ao entregador",
      "Rotas e histórico de entregas",
    ],
    icon: "courier",
  },
  {
    id: "printing",
    title: "Cardap Impressão",
    platform: "Computador",
    description: "Receba os pedidos e imprima as comandas na sua loja.",
    features: [
      "Painel de pedidos no computador",
      "Impressão automática ao aceitar pedidos",
    ],
    icon: "printing",
  },
] as const;
function AppIcon({ type }: { type: AppId }) {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {type === "waiter" ? (
        <>
          <path d="M3 17h18M5 17a7 7 0 0 1 14 0M12 8V6M10 6h4M5 21h14" />
        </>
      ) : type === "courier" ? (
        <>
          <path d="M4 15a8 8 0 1 1 16 0v4H8l-4-4ZM4 15h9l3-5h4" />
          <path d="M8 19v2h10v-2" />
        </>
      ) : (
        <>
          <path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <rect x="6" y="14" width="12" height="8" rx="1" />
          <path d="M18 12h.01" />
        </>
      )}
    </svg>
  );
}
export default function AppsHub({
  links,
}: {
  links: Record<AppId, string | null>;
}) {
  const { operations } = useStoreOperations();
  return (
    <div className="apps-hub">
      <header className="dashboard-heading">
        <div>
          <p className="eyebrow">Cardap com a sua equipe</p>
          <h1>Aplicativos Cardap</h1>
          <p>Conheça os aplicativos para o dia a dia do seu restaurante.</p>
        </div>
      </header>
      <div className="apps-hub-grid">
        {apps.map((app) => {
          const enabled =
            app.id === "waiter"
              ? operations.salon
              : app.id === "courier"
                ? operations.ownDelivery
                : true;
          return (
            <article className="app-hub-card" key={app.id}>
              <div className="app-hub-card-top">
                <span className="app-hub-icon">
                  <AppIcon type={app.id} />
                </span>
                <span className="app-hub-platform">{app.platform}</span>
              </div>
              <h2>{app.title}</h2>
              <p className="app-hub-description">{app.description}</p>
              <ul>
                {app.features.map((feature) => (
                  <li key={feature}>
                    <span aria-hidden="true">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              {app.id !== "printing" && (
                <p className="app-hub-module" data-enabled={enabled}>
                  <span aria-hidden="true" />
                  {enabled
                    ? app.id === "waiter"
                      ? "Salão habilitado"
                      : "Entrega própria habilitada"
                    : app.id === "waiter"
                      ? "Ative o salão para usar com sua equipe"
                      : "Ative a entrega própria para usar com sua equipe"}
                </p>
              )}
              <div className="app-hub-actions">
                {links[app.id] ? (
                  <a
                    className="button primary"
                    href={links[app.id]!}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Instalar aplicativo <span aria-hidden="true">↗</span>
                  </a>
                ) : (
                  <p className="app-hub-install-pending">
                    Link de instalação ainda não disponibilizado.
                  </p>
                )}
                <a
                  className="text-button"
                  href={
                    app.id === "printing"
                      ? "/dashboard/pedidos"
                      : enabled
                        ? app.id === "waiter"
                          ? "/dashboard/garcons"
                          : "/dashboard/entregadores"
                        : "/dashboard?view=settings&section=operations"
                  }
                >
                  {app.id === "printing"
                    ? "Abrir central de pedidos"
                    : enabled
                      ? "Ver equipe"
                      : "Habilitar nas configurações"}{" "}
                  <span aria-hidden="true">→</span>
                </a>
              </div>
            </article>
          );
        })}
      </div>
      <section
        className="apps-hub-guide"
        aria-labelledby="apps-hub-guide-title"
      >
        <h2 id="apps-hub-guide-title">Como liberar o acesso da equipe?</h2>
        <p>
          Cadastre o funcionário com o cargo Garçom ou Entregador e gere o link
          de acesso em Funcionários. No Cardap Impressão, entre com a conta do
          proprietário e escolha o computador responsável pelas impressões.
        </p>
        <a
          className="text-button"
          href="/dashboard?view=settings&section=employees"
        >
          Gerenciar funcionários →
        </a>
      </section>
    </div>
  );
}
