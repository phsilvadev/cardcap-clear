import PageBehavior from "./carrinho-behavior";

export default function CarrinhoContent() {
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
            <li className={"active"} aria-current={"step"}>
              {"1. Carrinho"}
            </li>
            <li className={""}>{"2. Entrega"}</li>
            <li className={""}>{"3. Pagamento"}</li>
            <li className={""}>{"4. Resumo"}</li>
          </ol>
          <h1 className={"flow-title"}>{"Seu carrinho"}</h1>
          <p className={"flow-subtitle"}>
            {"Confira os itens antes de continuar."}
          </p>
          <p className={"demo-banner"}>
            {
              "Prévia do fluxo de compra. Login, pedidos e pagamentos reais ainda não estão conectados."
            }
          </p>
          <div className={"flow-layout"}>
            <section className={"panel"}>
              <h2>{"Seus produtos"}</h2>
              <div id={"cart-lines"}></div>
              <div id={"empty-cart"} className={"empty-cart"} hidden={true}>
                <p>
                  {
                    "Seu carrinho está vazio. Para conhecer o fluxo sem fazer login, você pode carregar itens de exemplo."
                  }
                </p>
                <button
                  id={"load-example"}
                  className={"flow-button"}
                  type={"button"}
                >
                  {"Carregar carrinho de exemplo"}
                </button>
              </div>
              <a
                id={"checkout-link"}
                className={"flow-button full"}
                href={"/checkout"}
              >
                {"Continuar para entrega"}
              </a>
              <p
                id={"flow-status"}
                className={"flow-status"}
                role={"status"}
                aria-live={"polite"}
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
