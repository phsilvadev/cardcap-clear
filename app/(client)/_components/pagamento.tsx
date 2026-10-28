import PageBehavior from "@/app/(client)/_components/pagamento-behavior";

export default function PagamentoContent() {
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
            <li className={"active"} aria-current={"step"}>
              {"3. Pagamento"}
            </li>
            <li className={""}>{"4. Resumo"}</li>
          </ol>
          <h1 className={"flow-title"}>{"Escolha como pagar"}</h1>
          <p className={"flow-subtitle"}>
            {"Revise os dados e selecione uma forma de pagamento."}
          </p>
          <p className={"demo-banner"}>
            {
              "Prévia do fluxo de compra. Login, pedidos e pagamentos reais ainda não estão conectados."
            }
          </p>
          <div className={"flow-layout"}>
            <section className={"panel"}>
              <h2>{"Pagamento"}</h2>
              <form id={"payment-form"}>
                <fieldset className={"options"}>
                  <legend>{"Forma de pagamento"}</legend>
                  <label className={"option"}>
                    <input
                      type={"radio"}
                      name={"payment"}
                      value={"pix"}
                      defaultChecked={true}
                    />
                    {"Pix"}
                  </label>
                  <label className={"option"}>
                    <input type={"radio"} name={"payment"} value={"card"} />
                    {"Cartão na entrega ou retirada"}
                  </label>
                  <label className={"option"}>
                    <input type={"radio"} name={"payment"} value={"cash"} />
                    {"Dinheiro"}
                  </label>
                </fieldset>
                <p id={"payment-description"} className={"demo-banner"}></p>
                <h2 style={{ marginTop: "24px" }}>{"Recebimento"}</h2>
                <p
                  id={"delivery-review"}
                  className={"confirmation-details"}
                ></p>
                <button className={"flow-button full"} type={"submit"}>
                  {"Concluir simulação"}
                </button>
                <p className={"flow-note"}>
                  {
                    "Nenhuma cobrança será feita. Não informe dados de cartão. Não será gerado código Pix."
                  }
                </p>
                <p
                  id={"flow-status"}
                  className={"flow-status"}
                  role={"status"}
                  aria-live={"polite"}
                ></p>
              </form>
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
