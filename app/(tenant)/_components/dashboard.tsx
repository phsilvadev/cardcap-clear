import type { Tenant } from "@/lib/tenant";
import PageBehavior from "@/app/(tenant)/_components/dashboard-behavior";

export default function DashboardContent({ tenant }: { tenant: Tenant }) {
  return (
    <>
      <a href={"#dashboard-main"} className={"sr-only focus:not-sr-only"}>
        {"Ir para o conteúdo"}
      </a>
      <div className={"dashboard"}>
        <aside className={"sidebar"}>
          <a
            href={"/"}
            className={"wordmark text-3xl"}
            aria-label={"Cardap — início"}
          >
            {"cardap"}
            <span className={"text-brand"}>{"."}</span>
          </a>
          <div className={"workspace"}>
            <svg
              xmlns={"http://www.w3.org/2000/svg"}
              width={"20"}
              height={"20"}
              viewBox={"0 0 24 24"}
              fill={"none"}
              stroke={"currentColor"}
              strokeWidth={"2"}
              strokeLinecap={"round"}
              strokeLinejoin={"round"}
              className={"lucide lucide-store"}
              aria-hidden={"true"}
              focusable={"false"}
            >
              <path d={"M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5"}></path>
              <path
                d={
                  "M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244"
                }
              ></path>
              <path
                d={"M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05"}
              ></path>
            </svg>
            <div>
              <strong className={"store-name"}>{tenant.name}</strong>
              <p>{"Área do restaurante"}</p>
            </div>
          </div>
          <nav aria-label={"Administração do restaurante"}>
            <button
              type={"button"}
              data-view={"overview"}
              aria-current={"page"}
            >
              <svg
                xmlns={"http://www.w3.org/2000/svg"}
                width={"20"}
                height={"20"}
                viewBox={"0 0 24 24"}
                fill={"none"}
                stroke={"currentColor"}
                strokeWidth={"2"}
                strokeLinecap={"round"}
                strokeLinejoin={"round"}
                className={"lucide lucide-layout-dashboard"}
                aria-hidden={"true"}
                focusable={"false"}
              >
                <rect width={"7"} height={"9"} x={"3"} y={"3"} rx={"1"}></rect>
                <rect width={"7"} height={"5"} x={"14"} y={"3"} rx={"1"}></rect>
                <rect
                  width={"7"}
                  height={"9"}
                  x={"14"}
                  y={"12"}
                  rx={"1"}
                ></rect>
                <rect width={"7"} height={"5"} x={"3"} y={"16"} rx={"1"}></rect>
              </svg>
              {"Visão geral"}
            </button>
            <button type={"button"} data-view={"orders"}>
              <svg
                xmlns={"http://www.w3.org/2000/svg"}
                width={"20"}
                height={"20"}
                viewBox={"0 0 24 24"}
                fill={"none"}
                stroke={"currentColor"}
                strokeWidth={"2"}
                strokeLinecap={"round"}
                strokeLinejoin={"round"}
                className={"lucide lucide-receipt-text"}
                aria-hidden={"true"}
                focusable={"false"}
              >
                <path d={"M13 16H8"}></path>
                <path d={"M14 8H8"}></path>
                <path d={"M16 12H8"}></path>
                <path
                  d={
                    "M4 3a1 1 0 0 1 1-1 1.3 1.3 0 0 1 .7.2l.933.6a1.3 1.3 0 0 0 1.4 0l.934-.6a1.3 1.3 0 0 1 1.4 0l.933.6a1.3 1.3 0 0 0 1.4 0l.933-.6a1.3 1.3 0 0 1 1.4 0l.934.6a1.3 1.3 0 0 0 1.4 0l.933-.6A1.3 1.3 0 0 1 19 2a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1 1.3 1.3 0 0 1-.7-.2l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.934.6a1.3 1.3 0 0 1-1.4 0l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-1.4 0l-.934-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-.7.2 1 1 0 0 1-1-1z"
                  }
                ></path>
              </svg>
              {"Pedidos"}
            </button>
            <button type={"button"} data-view={"menu"}>
              <svg
                xmlns={"http://www.w3.org/2000/svg"}
                width={"20"}
                height={"20"}
                viewBox={"0 0 24 24"}
                fill={"none"}
                stroke={"currentColor"}
                strokeWidth={"2"}
                strokeLinecap={"round"}
                strokeLinejoin={"round"}
                className={"lucide lucide-utensils"}
                aria-hidden={"true"}
                focusable={"false"}
              >
                <path d={"M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"}></path>
                <path d={"M7 2v20"}></path>
                <path
                  d={"M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"}
                ></path>
              </svg>
              {"Cardápio"}
            </button>
            <button type={"button"} data-view={"settings"}>
              <svg
                xmlns={"http://www.w3.org/2000/svg"}
                width={"20"}
                height={"20"}
                viewBox={"0 0 24 24"}
                fill={"none"}
                stroke={"currentColor"}
                strokeWidth={"2"}
                strokeLinecap={"round"}
                strokeLinejoin={"round"}
                className={"lucide lucide-settings"}
                aria-hidden={"true"}
                focusable={"false"}
              >
                <path
                  d={
                    "M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"
                  }
                ></path>
                <circle cx={"12"} cy={"12"} r={"3"}></circle>
              </svg>
              {"Configurações"}
            </button>
          </nav>
          <a className={"public-store"} id={"public-store"} href={"/loja"}>
            <svg
              xmlns={"http://www.w3.org/2000/svg"}
              width={"20"}
              height={"20"}
              viewBox={"0 0 24 24"}
              fill={"none"}
              stroke={"currentColor"}
              strokeWidth={"2"}
              strokeLinecap={"round"}
              strokeLinejoin={"round"}
              className={"lucide lucide-arrow-up-right"}
              aria-hidden={"true"}
              focusable={"false"}
            >
              <path d={"M7 7h10v10"}></path>
              <path d={"M7 17 17 7"}></path>
            </svg>
            {" Ver minha loja"}
          </a>
          <p className={"sidebar-note"}>{"Painel de demonstração"}</p>
        </aside>
        <div className={"dashboard-app"}>
          <header className={"dashboard-top"}>
            <span>
              {"Restaurante / "}
              <strong id={"breadcrumb"}>{"Visão geral"}</strong>
            </span>
            <button
              type={"button"}
              id={"store-toggle"}
              className={"store-switch"}
              role={"switch"}
              aria-checked={"true"}
              aria-label={"Receber pedidos na demonstração"}
            >
              <svg
                xmlns={"http://www.w3.org/2000/svg"}
                width={"20"}
                height={"20"}
                viewBox={"0 0 24 24"}
                fill={"none"}
                stroke={"currentColor"}
                strokeWidth={"2"}
                strokeLinecap={"round"}
                strokeLinejoin={"round"}
                className={"lucide lucide-store"}
                aria-hidden={"true"}
                focusable={"false"}
              >
                <path d={"M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5"}></path>
                <path
                  d={
                    "M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244"
                  }
                ></path>
                <path
                  d={"M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05"}
                ></path>
              </svg>
              <span id={"store-status"}>{"Recebendo pedidos"}</span>
              <span className={"switch-track"} aria-hidden={"true"}></span>
            </button>
          </header>
          <main id={"dashboard-main"} tabIndex={-1}>
            <div className={"dashboard-heading"}>
              <div>
                <p className={"eyebrow"}>{"Sua loja. Seus resultados."}</p>
                <h1 id={"view-title"}>{"Tudo pronto para servir."}</h1>
                <p id={"view-description"}>
                  {"Acompanhe os pedidos e cuide do seu restaurante."}
                </p>
              </div>
              <span className={"demo-pill"}>{"Demonstração"}</span>
            </div>
            <p className={"demo-banner"}>
              {
                "Dados fictícios. Nenhum pedido real é recebido ou alterado. As mudanças deste painel ficam nesta sessão do navegador."
              }
            </p>
            <section
              id={"view-overview"}
              className={"dashboard-view"}
              aria-label={"Visão geral"}
            >
              <div className={"stats-grid"}>
                <article className={"stat-card"}>
                  <p>
                    {"Pedidos do dia"}
                    <svg
                      xmlns={"http://www.w3.org/2000/svg"}
                      width={"20"}
                      height={"20"}
                      viewBox={"0 0 24 24"}
                      fill={"none"}
                      stroke={"currentColor"}
                      strokeWidth={"2"}
                      strokeLinecap={"round"}
                      strokeLinejoin={"round"}
                      className={"lucide lucide-receipt-text"}
                      aria-hidden={"true"}
                      focusable={"false"}
                    >
                      <path d={"M13 16H8"}></path>
                      <path d={"M14 8H8"}></path>
                      <path d={"M16 12H8"}></path>
                      <path
                        d={
                          "M4 3a1 1 0 0 1 1-1 1.3 1.3 0 0 1 .7.2l.933.6a1.3 1.3 0 0 0 1.4 0l.934-.6a1.3 1.3 0 0 1 1.4 0l.933.6a1.3 1.3 0 0 0 1.4 0l.933-.6a1.3 1.3 0 0 1 1.4 0l.934.6a1.3 1.3 0 0 0 1.4 0l.933-.6A1.3 1.3 0 0 1 19 2a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1 1.3 1.3 0 0 1-.7-.2l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.934.6a1.3 1.3 0 0 1-1.4 0l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-1.4 0l-.934-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-.7.2 1 1 0 0 1-1-1z"
                        }
                      ></path>
                    </svg>
                  </p>
                  <strong id={"stat-orders"}></strong>
                  <small>{"Dados de exemplo"}</small>
                </article>
                <article className={"stat-card"}>
                  <p>
                    {"Em andamento"}
                    <svg
                      xmlns={"http://www.w3.org/2000/svg"}
                      width={"20"}
                      height={"20"}
                      viewBox={"0 0 24 24"}
                      fill={"none"}
                      stroke={"currentColor"}
                      strokeWidth={"2"}
                      strokeLinecap={"round"}
                      strokeLinejoin={"round"}
                      className={"lucide lucide-clock"}
                      aria-hidden={"true"}
                      focusable={"false"}
                    >
                      <circle cx={"12"} cy={"12"} r={"10"}></circle>
                      <path d={"M12 6v6l4 2"}></path>
                    </svg>
                  </p>
                  <strong id={"stat-active"}></strong>
                  <small>{"Dados de exemplo"}</small>
                </article>
                <article className={"stat-card"}>
                  <p>
                    {"Vendas ilustrativas"}
                    <svg
                      xmlns={"http://www.w3.org/2000/svg"}
                      width={"20"}
                      height={"20"}
                      viewBox={"0 0 24 24"}
                      fill={"none"}
                      stroke={"currentColor"}
                      strokeWidth={"2"}
                      strokeLinecap={"round"}
                      strokeLinejoin={"round"}
                      className={"lucide lucide-wallet"}
                      aria-hidden={"true"}
                      focusable={"false"}
                    >
                      <path
                        d={
                          "M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"
                        }
                      ></path>
                      <path
                        d={"M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"}
                      ></path>
                    </svg>
                  </p>
                  <strong id={"stat-sales"}></strong>
                  <small>{"Dados de exemplo"}</small>
                </article>
                <article className={"stat-card"}>
                  <p>
                    {"Ticket médio"}
                    <svg
                      xmlns={"http://www.w3.org/2000/svg"}
                      width={"20"}
                      height={"20"}
                      viewBox={"0 0 24 24"}
                      fill={"none"}
                      stroke={"currentColor"}
                      strokeWidth={"2"}
                      strokeLinecap={"round"}
                      strokeLinejoin={"round"}
                      className={"lucide lucide-shopping-bag"}
                      aria-hidden={"true"}
                      focusable={"false"}
                    >
                      <path d={"M16 10a4 4 0 0 1-8 0"}></path>
                      <path d={"M3.103 6.034h17.794"}></path>
                      <path
                        d={
                          "M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z"
                        }
                      ></path>
                    </svg>
                  </p>
                  <strong id={"stat-average"}></strong>
                  <small>{"Dados de exemplo"}</small>
                </article>
              </div>
              <div className={"overview-grid"}>
                <section className={"panel"}>
                  <h2>{"Em andamento"}</h2>
                  <div id={"operation-rows"}></div>
                </section>
                <section className={"panel"}>
                  <h2>{"Gerenciar restaurante"}</h2>
                  <button
                    className={"action-row"}
                    type={"button"}
                    data-go={"menu"}
                  >
                    <svg
                      xmlns={"http://www.w3.org/2000/svg"}
                      width={"20"}
                      height={"20"}
                      viewBox={"0 0 24 24"}
                      fill={"none"}
                      stroke={"currentColor"}
                      strokeWidth={"2"}
                      strokeLinecap={"round"}
                      strokeLinejoin={"round"}
                      className={"lucide lucide-utensils"}
                      aria-hidden={"true"}
                      focusable={"false"}
                    >
                      <path d={"M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"}></path>
                      <path d={"M7 2v20"}></path>
                      <path
                        d={"M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"}
                      ></path>
                    </svg>
                    <span>
                      <strong>{"Produtos e disponibilidade"}</strong>
                      <small>{"Organize seu cardápio"}</small>
                    </span>
                    <svg
                      xmlns={"http://www.w3.org/2000/svg"}
                      width={"20"}
                      height={"20"}
                      viewBox={"0 0 24 24"}
                      fill={"none"}
                      stroke={"currentColor"}
                      strokeWidth={"2"}
                      strokeLinecap={"round"}
                      strokeLinejoin={"round"}
                      className={"lucide lucide-chevron-right"}
                      aria-hidden={"true"}
                      focusable={"false"}
                    >
                      <path d={"m9 18 6-6-6-6"}></path>
                    </svg>
                  </button>
                  <button
                    className={"action-row"}
                    type={"button"}
                    data-go={"settings"}
                  >
                    <svg
                      xmlns={"http://www.w3.org/2000/svg"}
                      width={"20"}
                      height={"20"}
                      viewBox={"0 0 24 24"}
                      fill={"none"}
                      stroke={"currentColor"}
                      strokeWidth={"2"}
                      strokeLinecap={"round"}
                      strokeLinejoin={"round"}
                      className={"lucide lucide-store"}
                      aria-hidden={"true"}
                      focusable={"false"}
                    >
                      <path
                        d={"M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5"}
                      ></path>
                      <path
                        d={
                          "M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244"
                        }
                      ></path>
                      <path
                        d={"M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05"}
                      ></path>
                    </svg>
                    <span>
                      <strong>{"Dados do restaurante"}</strong>
                      <small>{"Nome, telefone e descrição"}</small>
                    </span>
                    <svg
                      xmlns={"http://www.w3.org/2000/svg"}
                      width={"20"}
                      height={"20"}
                      viewBox={"0 0 24 24"}
                      fill={"none"}
                      stroke={"currentColor"}
                      strokeWidth={"2"}
                      strokeLinecap={"round"}
                      strokeLinejoin={"round"}
                      className={"lucide lucide-chevron-right"}
                      aria-hidden={"true"}
                      focusable={"false"}
                    >
                      <path d={"m9 18 6-6-6-6"}></path>
                    </svg>
                  </button>
                  <button
                    className={"action-row"}
                    type={"button"}
                    data-go={"orders"}
                  >
                    <svg
                      xmlns={"http://www.w3.org/2000/svg"}
                      width={"20"}
                      height={"20"}
                      viewBox={"0 0 24 24"}
                      fill={"none"}
                      stroke={"currentColor"}
                      strokeWidth={"2"}
                      strokeLinecap={"round"}
                      strokeLinejoin={"round"}
                      className={"lucide lucide-receipt-text"}
                      aria-hidden={"true"}
                      focusable={"false"}
                    >
                      <path d={"M13 16H8"}></path>
                      <path d={"M14 8H8"}></path>
                      <path d={"M16 12H8"}></path>
                      <path
                        d={
                          "M4 3a1 1 0 0 1 1-1 1.3 1.3 0 0 1 .7.2l.933.6a1.3 1.3 0 0 0 1.4 0l.934-.6a1.3 1.3 0 0 1 1.4 0l.933.6a1.3 1.3 0 0 0 1.4 0l.933-.6a1.3 1.3 0 0 1 1.4 0l.934.6a1.3 1.3 0 0 0 1.4 0l.933-.6A1.3 1.3 0 0 1 19 2a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1 1.3 1.3 0 0 1-.7-.2l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.934.6a1.3 1.3 0 0 1-1.4 0l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-1.4 0l-.934-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-.7.2 1 1 0 0 1-1-1z"
                        }
                      ></path>
                    </svg>
                    <span>
                      <strong>{"Todos os pedidos"}</strong>
                      <small>{"Acompanhe cada etapa"}</small>
                    </span>
                    <svg
                      xmlns={"http://www.w3.org/2000/svg"}
                      width={"20"}
                      height={"20"}
                      viewBox={"0 0 24 24"}
                      fill={"none"}
                      stroke={"currentColor"}
                      strokeWidth={"2"}
                      strokeLinecap={"round"}
                      strokeLinejoin={"round"}
                      className={"lucide lucide-chevron-right"}
                      aria-hidden={"true"}
                      focusable={"false"}
                    >
                      <path d={"m9 18 6-6-6-6"}></path>
                    </svg>
                  </button>
                </section>
              </div>
              <section className={"panel recent-panel"}>
                <div className={"section-heading"}>
                  <h2>{"Pedidos recentes"}</h2>
                  <button
                    type={"button"}
                    data-go={"orders"}
                    className={"text-button"}
                  >
                    {"Ver todos"}
                  </button>
                </div>
                <div id={"recent-orders"} className={"order-list"}></div>
              </section>
            </section>
            <section
              id={"view-orders"}
              className={"dashboard-view"}
              aria-label={"Pedidos"}
              hidden={true}
            >
              <div className={"order-toolbar"}>
                <label className={"search-label"} htmlFor={"order-query"}>
                  {"Buscar pedido"}
                  <input
                    id={"order-query"}
                    type={"search"}
                    placeholder={"Nome do cliente ou número"}
                    maxLength={100}
                  />
                </label>
                <label className={"search-label"} htmlFor={"order-filter"}>
                  {"Status"}
                  <select id={"order-filter"}>
                    <option value={"all"}>{"Todos"}</option>
                    <option value={"new"}>{"Novos"}</option>
                    <option value={"preparing"}>{"Em preparo"}</option>
                    <option value={"delivery"}>{"Em entrega"}</option>
                    <option value={"done"}>{"Concluídos"}</option>
                  </select>
                </label>
              </div>
              <div id={"orders-list"} className={"order-list"}></div>
              <p id={"no-orders"} className={"flow-note"} hidden={true}>
                {"Nenhum pedido encontrado para esses filtros."}
              </p>
            </section>
            <section
              id={"view-menu"}
              className={"dashboard-view"}
              aria-label={"Cardápio"}
              hidden={true}
            >
              <section className={"panel"}>
                <h2>{"Produtos e disponibilidade"}</h2>
                <p className={"flow-subtitle"}>
                  {"Ative ou pause produtos nesta demonstração."}
                </p>
                <div
                  id={"products-list"}
                  className={"product-management"}
                ></div>
              </section>
            </section>
            <section
              id={"view-settings"}
              className={"dashboard-view"}
              aria-label={"Configurações"}
              hidden={true}
            >
              <section className={"panel settings-panel"}>
                <h2>{"Dados do restaurante"}</h2>
                <form id={"settings-form"}>
                  <label className={"flow-field"} htmlFor={"setting-name"}>
                    {"Nome da loja"}
                    <input
                      id={"setting-name"}
                      required={true}
                      minLength={2}
                      maxLength={80}
                    />
                  </label>
                  <label className={"flow-field"} htmlFor={"setting-phone"}>
                    {"Telefone"}
                    <input
                      id={"setting-phone"}
                      type={"tel"}
                      maxLength={20}
                      required={true}
                    />
                  </label>
                  <label
                    className={"flow-field"}
                    htmlFor={"setting-description"}
                  >
                    {"Descrição"}
                    <textarea
                      id={"setting-description"}
                      maxLength={300}
                      required={true}
                    ></textarea>
                  </label>
                  <button type={"submit"} className={"flow-button full"}>
                    {"Salvar alterações de demonstração"}
                  </button>
                </form>
              </section>
            </section>
            <p
              id={"dashboard-feedback"}
              className={"flow-status"}
              role={"status"}
              aria-live={"polite"}
            ></p>
          </main>
          <footer className={"dashboard-footer"}>
            <span className={"wordmark"}>
              {"cardap"}
              <span className={"text-brand"}>{"."}</span>
            </span>
            <p>{"Área do restaurante · Prévia de gestão"}</p>
          </footer>
        </div>
      </div>
      <PageBehavior tenant={tenant} />
    </>
  );
}
