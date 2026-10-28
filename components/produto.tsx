import PageBehavior from "./produto-behavior";

export default function ProdutoContent() {
  return (
    <>
      <a href={"#conteudo"} className={"sr-only focus:not-sr-only"}>
        {"Ir para o conteúdo"}
      </a>
      <div className={"shell"}>
        <header className={"listing-header"}>
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
            <a id={"back"} href={"/loja"} className={"link-icon back"}>
              <svg
                width={"20"}
                height={"20"}
                viewBox={"0 0 24 24"}
                fill={"none"}
                stroke={"currentColor"}
                strokeWidth={"2"}
                strokeLinecap={"round"}
                strokeLinejoin={"round"}
                className={"lucide lucide-arrow-left"}
                aria-hidden={"true"}
              >
                <path d={"m12 19-7-7 7-7M5 12h14"}></path>
              </svg>
              {" Voltar à loja"}
            </a>
          </nav>
        </header>
        {"\n"}
        <main id={"conteudo"}>
          <section
            className={"product-detail"}
            aria-labelledby={"product-name"}
          >
            <div
              id={"product-art"}
              className={"detail-art"}
              aria-hidden={"true"}
            ></div>
            <div className={"detail-copy"}>
              <p id={"product-category"} className={"eyebrow"}></p>
              <h1 id={"product-name"}></h1>
              <p
                id={"product-description"}
                className={"detail-description"}
              ></p>
              <strong id={"product-price"} className={"detail-price"}></strong>
              <div className={"purchase-actions"}>
                <div
                  className={"quantity-control"}
                  role={"group"}
                  aria-label={"Quantidade do produto"}
                >
                  <button
                    id={"quantity-minus"}
                    type={"button"}
                    aria-label={"Diminuir quantidade"}
                    disabled={true}
                  >
                    <svg
                      className={"lucide lucide-minus"}
                      width={"18"}
                      height={"18"}
                      viewBox={"0 0 24 24"}
                      fill={"none"}
                      stroke={"currentColor"}
                      strokeWidth={"2"}
                      strokeLinecap={"round"}
                      strokeLinejoin={"round"}
                      aria-hidden={"true"}
                    >
                      <path d={"M5 12h14"}></path>
                    </svg>
                  </button>
                  <output
                    id={"quantity"}
                    aria-live={"polite"}
                    aria-label={"Quantidade"}
                  >
                    {"1"}
                  </output>
                  <button
                    id={"quantity-plus"}
                    type={"button"}
                    aria-label={"Aumentar quantidade"}
                  >
                    <svg
                      className={"lucide lucide-plus"}
                      width={"18"}
                      height={"18"}
                      viewBox={"0 0 24 24"}
                      fill={"none"}
                      stroke={"currentColor"}
                      strokeWidth={"2"}
                      strokeLinecap={"round"}
                      strokeLinejoin={"round"}
                      aria-hidden={"true"}
                    >
                      <path d={"M5 12h14M12 5v14"}></path>
                    </svg>
                  </button>
                </div>
                <button
                  id={"add-to-cart"}
                  className={"add-to-cart"}
                  type={"button"}
                >
                  <span>{"Adicionar ao carrinho"}</span>
                  <strong id={"cart-total"}></strong>
                </button>
              </div>
              <p
                id={"cart-feedback"}
                className={"cart-feedback"}
                role={"status"}
                aria-live={"polite"}
              ></p>
              <a
                id={"product-store"}
                className={"detail-store"}
                href={"/loja"}
              ></a>
              <p id={"product-region"} className={"detail-location"}></p>
              <p className={"product-notice"}>
                {
                  "Produto e preço ilustrativos. O carrinho desta prévia fica salvo neste navegador. Pedidos e pagamentos ainda não estão disponíveis."
                }
              </p>
              <a id={"menu-link"} href={"/loja"} className={"return-menu"}>
                {"Ver cardápio da loja "}
                <svg
                  width={"20"}
                  height={"20"}
                  viewBox={"0 0 24 24"}
                  fill={"none"}
                  stroke={"currentColor"}
                  strokeWidth={"2"}
                  strokeLinecap={"round"}
                  strokeLinejoin={"round"}
                  className={"lucide lucide-arrow-left"}
                  aria-hidden={"true"}
                >
                  <path d={"m12 19-7-7 7-7M5 12h14"}></path>
                </svg>
              </a>
            </div>
          </section>
          <aside className={"detail-bottom"}>
            <p>
              {"Quer experimentar outros sabores?"}
              <br />
              {"Explore as outras opções no cardápio desta loja."}
            </p>
            <span className={"hashtag text-brand"}>{"#PARTIUCOMER"}</span>
          </aside>
        </main>
        <footer className={"listing-footer"}>
          <a href={"/"} className={"wordmark text-2xl text-ink"}>
            {"cardap"}
            <span className={"text-brand"}>{"."}</span>
          </a>
          <p>{"Cardap · Sua próxima refeição começa aqui."}</p>
        </footer>
      </div>
      <button
        type={"button"}
        id={"floating-cart"}
        className={"floating-cart"}
        aria-haspopup={"dialog"}
        aria-controls={"cart-dialog"}
        hidden={true}
      >
        <svg
          className={"lucide lucide-shopping-bag"}
          width={"22"}
          height={"22"}
          viewBox={"0 0 24 24"}
          fill={"none"}
          stroke={"currentColor"}
          strokeWidth={"2"}
          strokeLinecap={"round"}
          strokeLinejoin={"round"}
          aria-hidden={"true"}
        >
          <path
            d={
              "M16 10a4 4 0 0 1-8 0M3.103 6.034h17.794M3.4 5.467A2 2 0 0 0 3 6.667V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z"
            }
          ></path>
        </svg>
        <span>{"Ver carrinho"}</span>
        <span id={"floating-count"} className={"floating-count"}>
          {"0"}
        </span>
      </button>
      <dialog id={"cart-dialog"} aria-labelledby={"cart-dialog-title"}>
        <div className={"cart-dialog-heading"}>
          <h2 id={"cart-dialog-title"} className={"text-2xl font-bold"}>
            {"Seu carrinho"}
          </h2>
          <form method={"dialog"}>
            <button type={"submit"}>{"Fechar"}</button>
          </form>
        </div>
        <p id={"cart-dialog-store"} className={"text-sm text-muted mt-2"}></p>
        <ul id={"cart-dialog-items"} className={"cart-dialog-items"}></ul>
        <p
          id={"cart-empty"}
          className={"cart-empty"}
          role={"status"}
          hidden={true}
        >
          {"Seu carrinho está vazio."}
        </p>
        <p
          id={"cart-modal-feedback"}
          className={"cart-dialog-note"}
          role={"status"}
          aria-live={"polite"}
        ></p>
        <p className={"cart-dialog-total"}>
          <span>{"Total"}</span>
          <span id={"cart-dialog-total"}></span>
        </p>
        <a
          id={"cart-checkout-link"}
          className={"return-menu"}
          href={"/carrinho"}
        >
          {"Continuar para o carrinho"}
        </a>
        <p className={"cart-dialog-note"}>
          {
            "Carrinho demonstrativo salvo neste navegador. Pedidos e pagamentos ainda não estão disponíveis."
          }
        </p>
      </dialog>
      <dialog
        id={"login-dialog"}
        className={"login-dialog"}
        aria-labelledby={"login-title"}
        aria-describedby={"login-description login-preview"}
      >
        <div className={"login-heading"}>
          <h2 id={"login-title"}>{"Entre para continuar"}</h2>
          <form method={"dialog"}>
            <button
              type={"submit"}
              className={"login-close"}
              aria-label={"Fechar login"}
            >
              {"×"}
            </button>
          </form>
        </div>
        <p id={"login-description"} className={"login-description"}>
          {"Acesse sua conta para adicionar este produto ao carrinho."}
        </p>
        <p id={"login-preview"} className={"login-preview"}>
          {
            "Modo demonstração: clique em Entrar ou Google para usar um cliente fictício. Não é necessário preencher e-mail ou senha. Nenhuma credencial será enviada ou salva."
          }
        </p>
        <button type={"button"} id={"login-google"} className={"login-google"}>
          <svg
            aria-hidden={"true"}
            width={"20"}
            height={"20"}
            viewBox={"0 0 24 24"}
          >
            {"\n      "}
            <path
              fill={"#4285F4"}
              d={
                "M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.89-1.74 2.98-4.31 2.98-7.36Z"
              }
            ></path>
            {"\n      "}
            <path
              fill={"#34A853"}
              d={
                "M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.05.97-3.38.97-2.6 0-4.81-1.76-5.6-4.12H3.05v2.59A10 10 0 0 0 12 22Z"
              }
            ></path>
            {"\n      "}
            <path
              fill={"#FBBC05"}
              d={
                "M6.4 13.93A6 6 0 0 1 6.09 12c0-.67.11-1.32.31-1.93V7.48H3.05A10 10 0 0 0 2 12c0 1.61.38 3.14 1.05 4.52l3.35-2.59Z"
              }
            ></path>
            {"\n      "}
            <path
              fill={"#EA4335"}
              d={
                "M12 5.95c1.47 0 2.79.5 3.82 1.5l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.95 5.48l3.35 2.59C7.19 7.71 9.4 5.95 12 5.95Z"
              }
            ></path>
            {"\n    "}
          </svg>
          {" Continuar com Google"}
        </button>
        <div className={"login-divider"} aria-hidden={"true"}>
          {"ou entre com e-mail"}
        </div>
        <form id={"login-form"} noValidate={true}>
          <label className={"login-field"} htmlFor={"login-email"}>
            {"E-mail"}
            <input
              id={"login-email"}
              type={"email"}
              autoComplete={"email"}
              autoCapitalize={"none"}
              spellCheck={"false"}
              placeholder={"voce@exemplo.com"}
              required={true}
              maxLength={254}
            />
          </label>
          <label className={"login-field"} htmlFor={"login-password"}>
            {"Senha"}
            <input
              id={"login-password"}
              type={"password"}
              autoComplete={"current-password"}
              placeholder={"Sua senha"}
              required={true}
            />
          </label>
          <button type={"submit"} className={"login-submit"}>
            {"Entrar"}
          </button>
        </form>
        <p
          id={"login-feedback"}
          className={"login-feedback"}
          role={"status"}
          aria-live={"polite"}
        ></p>
      </dialog>
      <PageBehavior />
    </>
  );
}
