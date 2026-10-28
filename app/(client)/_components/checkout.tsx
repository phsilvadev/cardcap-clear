import PageBehavior from "@/app/(client)/_components/checkout-behavior";

export default function CheckoutContent() {
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
            <li className={"active"} aria-current={"step"}>
              {"2. Entrega"}
            </li>
            <li className={""}>{"3. Pagamento"}</li>
            <li className={""}>{"4. Resumo"}</li>
          </ol>
          <h1 className={"flow-title"}>{"Como você quer receber?"}</h1>
          <p className={"flow-subtitle"}>
            {"Preencha os dados para simular a entrega ou a retirada."}
          </p>
          <p className={"demo-banner"}>
            {
              "Prévia do fluxo de compra. Login, pedidos e pagamentos reais ainda não estão conectados."
            }
          </p>
          <div className={"flow-layout"}>
            <section className={"panel"}>
              <form id={"checkout-form"}>
                <h2>{"Seus dados"}</h2>
                <label className={"flow-field"} htmlFor={"customer-name"}>
                  {"Nome"}
                  <input
                    id={"customer-name"}
                    autoComplete={"name"}
                    minLength={2}
                    maxLength={100}
                    required={true}
                    placeholder={"Seu nome"}
                  />
                </label>
                <label className={"flow-field"} htmlFor={"customer-phone"}>
                  {"Telefone com DDD"}
                  <input
                    id={"customer-phone"}
                    type={"tel"}
                    autoComplete={"tel"}
                    maxLength={20}
                    required={true}
                    placeholder={"(11) 99999-9999"}
                  />
                </label>
                <fieldset className={"options"}>
                  <legend>{"Recebimento"}</legend>
                  <label className={"option"}>
                    <input
                      type={"radio"}
                      name={"fulfillment"}
                      value={"delivery"}
                      defaultChecked={true}
                    />
                    {"Entrega"}
                  </label>
                  <label className={"option"}>
                    <input
                      type={"radio"}
                      name={"fulfillment"}
                      value={"pickup"}
                    />
                    {"Retirar na loja"}
                  </label>
                </fieldset>
                <div id={"address-fields"}>
                  <label className={"flow-field"} htmlFor={"customer-address"}>
                    {"Endereço de entrega"}
                    <input
                      id={"customer-address"}
                      autoComplete={"street-address"}
                      minLength={5}
                      maxLength={200}
                      required={true}
                      placeholder={"Rua, número, bairro e complemento"}
                    />
                  </label>
                </div>
                <p id={"pickup-note"} className={"flow-note"} hidden={true}>
                  {
                    "Endereço e horário de retirada serão combinados com a loja. Esta prévia não agenda retiradas."
                  }
                </p>
                <label className={"flow-field"} htmlFor={"order-notes"}>
                  {"Observações (opcional)"}
                  <textarea
                    id={"order-notes"}
                    maxLength={300}
                    placeholder={"Alguma observação para a loja?"}
                  ></textarea>
                </label>
                <button className={"flow-button full"} type={"submit"}>
                  {"Continuar para pagamento"}
                </button>
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
