import PageBehavior from "./cliente-behavior";

export default function ClienteContent() {
  return (
    <>
      <a href={"#conteudo"} className={"sr-only focus:not-sr-only"}>
        {"Ir para o conteúdo"}
      </a>
      <div className={"flow-shell"}>
        <header className={"flow-header"}>
          <a
            href={"/"}
            aria-label={"Cardap — início"}
            className={"wordmark text-3xl"}
          >
            {"cardap"}
            <span className={"text-brand"}>{"."}</span>
          </a>
          <a href={"/#buscar"}>{"Encontrar restaurantes"}</a>
        </header>
        <main id={"conteudo"}>
          <div className={"account-intro"}>
            <p className={"hashtag text-3xl text-brand"}>{"#MINHACONTA"}</p>
            <h1 className={"flow-title"} id={"welcome"}>
              {"Sua área no Cardap"}
            </h1>
            <p className={"flow-subtitle"}>
              {"Seu perfil, seus carrinhos e suas próximas escolhas."}
            </p>
            <p className={"demo-banner"}>
              {
                "Área demonstrativa. Os dados ficam neste navegador; não há autenticação real nem pedidos enviados às lojas."
              }
            </p>
          </div>
          <section
            id={"guest"}
            className={"panel"}
            hidden={true}
            style={{ marginBottom: "32px" }}
          >
            <h2>{"Entre para explorar sua conta"}</h2>
            <p className={"flow-subtitle"}>
              {
                "Use um cliente fictício para conhecer esta área e continuar a simulação."
              }
            </p>
            <button
              id={"demo-login"}
              className={"flow-button"}
              type={"button"}
              style={{ marginTop: "20px" }}
            >
              {"Entrar como cliente de demonstração"}
            </button>
            <p
              id={"guest-status"}
              className={"account-status"}
              role={"status"}
            ></p>
          </section>
          <div className={"account-layout"} id={"account"}>
            <aside className={"account-nav"}>
              <div className={"account-avatar"} aria-hidden={"true"}>
                <svg
                  className={"lucide lucide-user-round"}
                  width={"24"}
                  height={"24"}
                  viewBox={"0 0 24 24"}
                  fill={"none"}
                  stroke={"currentColor"}
                  strokeWidth={"2"}
                  strokeLinecap={"round"}
                  strokeLinejoin={"round"}
                >
                  <circle cx={"12"} cy={"8"} r={"5"}></circle>
                  <path d={"M20 21a8 8 0 0 0-16 0"}></path>
                </svg>
              </div>
              <strong id={"account-name"}></strong>
              <p
                id={"account-email"}
                className={"account-state"}
                style={{ overflowWrap: "anywhere", marginTop: "8px" }}
              ></p>
              <nav aria-label={"Minha conta"}>
                <a href={"#overview"}>{"Visão geral"}</a>
                <a href={"#profile"}>{"Meu perfil"}</a>
                <a href={"#carts"}>{"Meus carrinhos"}</a>
                <a href={"#orders"}>{"Meus pedidos"}</a>
              </nav>
              <button
                id={"sign-out"}
                className={"account-exit"}
                type={"button"}
              >
                {"Sair da sessão"}
              </button>
            </aside>
            <div className={"account-content"}>
              <section
                className={"account-stats"}
                id={"overview"}
                aria-label={"Resumo da conta"}
              >
                <div className={"account-stat"}>
                  <strong id={"cart-count"}>{"0"}</strong>
                  <span>{"Itens nos carrinhos"}</span>
                </div>
                <div className={"account-stat"}>
                  <strong id={"order-count"}>{"0"}</strong>
                  <span>{"Simulações recentes"}</span>
                </div>
              </section>
              <section id={"profile"} className={"panel"}>
                <h2>{"Meu perfil"}</h2>
                <form id={"profile-form"}>
                  <div className={"account-profile"}>
                    <label htmlFor={"profile-name"} className={"flow-field"}>
                      {"Nome"}
                      <input
                        id={"profile-name"}
                        autoComplete={"name"}
                        minLength={2}
                        maxLength={100}
                        required={true}
                      />
                    </label>
                    <label htmlFor={"profile-email"} className={"flow-field"}>
                      {"E-mail"}
                      <input
                        id={"profile-email"}
                        type={"email"}
                        autoComplete={"email"}
                        maxLength={254}
                        required={true}
                      />
                    </label>
                  </div>
                  <button
                    className={"flow-button"}
                    style={{ marginTop: "20px" }}
                    type={"submit"}
                  >
                    {"Salvar perfil de demonstração"}
                  </button>
                  <p
                    id={"profile-status"}
                    className={"account-status"}
                    role={"status"}
                    aria-live={"polite"}
                  ></p>
                </form>
              </section>
              <section id={"carts"} className={"panel"}>
                <h2>{"Seus carrinhos"}</h2>
                <div id={"cart-list"} className={"account-list"}></div>
                <p id={"no-carts"} className={"account-state"}>
                  {
                    "Você ainda não tem produtos no carrinho. Explore os restaurantes para escolher seu próximo sabor."
                  }
                </p>
                <a
                  href={"/#buscar"}
                  className={"flow-button"}
                  style={{ marginTop: "20px" }}
                >
                  {"Explorar restaurantes"}
                </a>
              </section>
              <section id={"orders"} className={"panel"}>
                <h2>{"Meus pedidos"}</h2>
                <p className={"account-state"} style={{ marginBottom: "20px" }}>
                  {
                    "Última simulação de cada loja nesta sessão. Nenhum pedido ou pagamento real foi realizado."
                  }
                </p>
                <div id={"order-list"} className={"account-list"}></div>
                <p id={"no-orders"} className={"account-state"}>
                  {"Nenhuma simulação concluída por enquanto."}
                </p>
              </section>
            </div>
          </div>
          <p
            id={"account-status"}
            className={"account-status"}
            role={"status"}
            aria-live={"polite"}
          ></p>
        </main>
        <footer className={"flow-footer"}>
          <span className={"wordmark text-2xl text-ink"}>
            {"cardap"}
            <span className={"text-brand"}>{"."}</span>
          </span>
          <p>{"Sua próxima refeição começa aqui."}</p>
        </footer>
      </div>
      <PageBehavior />
    </>
  );
}
