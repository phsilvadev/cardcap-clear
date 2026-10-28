import PageBehavior from "./pedido-confirmado-behavior";

export default function PedidoConfirmadoContent() {
  return (
    <>
      <a href={"#conteudo"} className={"sr-only focus:not-sr-only"}>
        {"Ir para o conteúdo"}
      </a>
      <div className={"flow-shell"}>
        <header className={"flow-header"}>
          <a
            href={"/"}
            className={"wordmark text-3xl"}
            aria-label={"Cardap — início"}
          >
            {"cardap"}
            <span className={"text-brand"}>{"."}</span>
          </a>
          <nav
            aria-label={"Navegação do cliente"}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              flexWrap: "wrap",
              fontSize: "14px",
            }}
          >
            <a href={"/cliente"}>{"Minha conta"}</a>
            <a id={"back-link"} href={"/loja"}>
              {"Voltar"}
            </a>
          </nav>
        </header>
        <main id={"conteudo"}>
          <ol className={"steps"} aria-label={"Etapas do pedido"}>
            <li className={""}>{"1. Carrinho"}</li>
            <li className={""}>{"2. Entrega"}</li>
            <li className={""}>{"3. Pagamento"}</li>
            <li className={"active"} aria-current={"step"}>
              {"4. Resumo"}
            </li>
          </ol>
          <h1 className={"flow-title"}>{"Simulação concluída!"}</h1>
          <p className={"flow-subtitle"}>
            {"Confira o resumo desta experiência demonstrativa."}
          </p>
          <p className={"demo-banner"}>
            {
              "Prévia do fluxo de compra. Login, pedidos e pagamentos reais ainda não estão conectados."
            }
          </p>
          <div className={"flow-layout"}>
            <section className={"panel"}>
              <div className={"confirmation-icon"} aria-hidden={"true"}>
                <svg
                  className={"lucide lucide-check"}
                  viewBox={"0 0 24 24"}
                  fill={"none"}
                  stroke={"currentColor"}
                  strokeWidth={"2"}
                  strokeLinecap={"round"}
                  strokeLinejoin={"round"}
                >
                  <path d={"m20 6-11 11-5-5"}></path>
                </svg>
              </div>
              <h2 id={"confirmation-title"}>{"Resumo da simulação"}</h2>
              <p
                id={"confirmation-details"}
                className={"confirmation-details"}
              ></p>
              <p className={"demo-banner"}>
                {
                  "Nenhum pedido foi enviado à loja e nenhum pagamento foi processado."
                }
              </p>
              <a
                id={"return-store"}
                href={"/loja"}
                className={"flow-button full"}
              >
                {"Voltar ao cardápio"}
              </a>
              <p
                id={"flow-status"}
                role={"status"}
                className={"flow-status"}
              ></p>
            </section>
            <aside className={"panel"}>
              <h2>{"Resumo do pedido"}</h2>
              <p id={"summary-store"} className={"flow-subtitle"}></p>
              <div id={"summary-items"}></div>
              <div className={"summary-line"}>
                <span>{"Entrega"}</span>
                <span>{"A combinar"}</span>
              </div>
              <div className={"summary-line summary-total"}>
                <span>{"Subtotal"}</span>
                <span id={"summary-total"}></span>
              </div>
              <p className={"flow-note"}>
                {
                  "Valores ilustrativos. Taxa e disponibilidade de entrega não estão definidas nesta prévia."
                }
              </p>
            </aside>
          </div>
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
