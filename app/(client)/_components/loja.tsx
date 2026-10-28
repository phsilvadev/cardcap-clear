import PageBehavior from "@/app/(client)/_components/loja-behavior";

export default function LojaContent() {
  return (
    <>
      {"\n"}
      <a className={"sr-only focus:not-sr-only"} href={"#conteudo"}>
        {"Ir para o conteúdo"}
      </a>
      <div className={"shell"}>
        {"\n"}
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
            <a id={"back"} href={"/restaurantes"} className={"link-icon back"}>
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
                className={"lucide lucide-arrow-left"}
                aria-hidden={"true"}
                focusable={"false"}
              >
                <path d={"m12 19-7-7 7-7"}></path>
                <path d={"M19 12H5"}></path>
              </svg>
              {" Restaurantes"}
            </a>
          </nav>
        </header>
        {"\n"}
        <main id={"conteudo"}>
          <section className={"store-hero"} aria-labelledby={"store-name"}>
            <div className={"store-cover"} aria-hidden={"true"}>
              <span className={"hashtag"}>{"#PARTIUCOMER"}</span>
              <svg
                xmlns={"http://www.w3.org/2000/svg"}
                width={"64"}
                height={"64"}
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
            </div>
            <div className={"store-summary"}>
              <p id={"store-category"} className={"eyebrow"}>
                {"Restaurante"}
              </p>
              <h1 id={"store-name"}>{"Conheça a loja"}</h1>
              <p id={"store-description"}>
                {"Descubra os sabores desta loja e explore o cardápio."}
              </p>
              <div className={"store-meta"}>
                <span>
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
                    className={"lucide lucide-map-pin"}
                    aria-hidden={"true"}
                    focusable={"false"}
                  >
                    <path
                      d={
                        "M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"
                      }
                    ></path>
                    <circle cx={"12"} cy={"10"} r={"3"}></circle>
                  </svg>
                  <span id={"store-region"}>{"Região não informada"}</span>
                </span>
                <span className={"demo-label"}>{"Loja demonstrativa"}</span>
                <button type={"button"} id={"info-button"}>
                  <svg
                    xmlns={"http://www.w3.org/2000/svg"}
                    width={"16"}
                    height={"16"}
                    viewBox={"0 0 24 24"}
                    fill={"none"}
                    stroke={"currentColor"}
                    strokeWidth={"2"}
                    strokeLinecap={"round"}
                    strokeLinejoin={"round"}
                    className={"lucide lucide-info"}
                    aria-hidden={"true"}
                    focusable={"false"}
                  >
                    <circle cx={"12"} cy={"12"} r={"10"}></circle>
                    <path d={"M12 16v-4"}></path>
                    <path d={"M12 8h.01"}></path>
                  </svg>
                  {" Informações da loja"}
                </button>
              </div>
            </div>
          </section>
          {"\n"}
          <div className={"menu-layout"}>
            <section aria-labelledby={"menu-title"}>
              <p className={"eyebrow"}>{"Escolha seu próximo sabor"}</p>
              <h2 className={"menu-heading"} id={"menu-title"}>
                {"Cardápio da loja"}
              </h2>
              <label htmlFor={"menu-search"} className={"search-field"}>
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
                  className={"lucide lucide-search"}
                  aria-hidden={"true"}
                  focusable={"false"}
                >
                  <path d={"m21 21-4.34-4.34"}></path>
                  <circle cx={"11"} cy={"11"} r={"8"}></circle>
                </svg>
                <span className={"sr-only"}>{"Buscar no cardápio"}</span>
                <input
                  type={"search"}
                  id={"menu-search"}
                  maxLength={100}
                  placeholder={"O que você quer comer?"}
                />
              </label>
              <div
                className={"categories"}
                role={"group"}
                aria-label={"Categorias do cardápio"}
              >
                <button
                  className={"category"}
                  type={"button"}
                  data-menu={"Todos"}
                  aria-pressed={"true"}
                >
                  {"Todos"}
                </button>
                <button
                  className={"category"}
                  id={"main-category"}
                  type={"button"}
                  data-menu={"Especialidades"}
                  aria-pressed={"false"}
                >
                  {"Especialidades"}
                </button>
                <button
                  className={"category"}
                  type={"button"}
                  data-menu={"Bebidas"}
                  aria-pressed={"false"}
                >
                  {"Bebidas"}
                </button>
              </div>
              <p
                id={"menu-count"}
                role={"status"}
                aria-live={"polite"}
                className={"text-sm text-muted mt-4"}
              ></p>
              <div id={"menu-products"}></div>
              <p id={"menu-empty"} hidden={true}>
                {"Nenhum item encontrado. Experimente outro nome ou categoria."}
              </p>
            </section>
            {"\n"}
            <aside className={"about-store"}>
              <h2>{"Um sabor por perto."}</h2>
              <p>
                {
                  "Uma nova descoberta começa pelo cardápio. Explore as opções desta prévia e encontre sua próxima refeição."
                }
              </p>
              <p>
                {
                  "Produtos e preços são ilustrativos. Pedidos, horários e entrega ainda não estão disponíveis."
                }
              </p>
              <span className={"hashtag"}>{"Bom apetite!"}</span>
            </aside>
          </div>
        </main>
        {"\n"}
        <footer className={"listing-footer"}>
          <a href={"/"} className={"wordmark text-2xl text-ink"}>
            {"cardap"}
            <span className={"text-brand"}>{"."}</span>
          </a>
          <p>{"Cardap · Sua próxima refeição começa aqui."}</p>
          <a id={"footer-back"} href={"/restaurantes"} className={"link-icon"}>
            <svg
              xmlns={"http://www.w3.org/2000/svg"}
              width={"16"}
              height={"16"}
              viewBox={"0 0 24 24"}
              fill={"none"}
              stroke={"currentColor"}
              strokeWidth={"2"}
              strokeLinecap={"round"}
              strokeLinejoin={"round"}
              className={"lucide lucide-arrow-left"}
              aria-hidden={"true"}
              focusable={"false"}
            >
              <path d={"m12 19-7-7 7-7"}></path>
              <path d={"M19 12H5"}></path>
            </svg>
            {" Voltar aos restaurantes"}
          </a>
        </footer>
      </div>
      {"\n"}
      <dialog id={"store-info"} aria-labelledby={"info-title"}>
        <div className={"dialog-top"}>
          <h2 id={"info-title"}>{"Informações da loja"}</h2>
          <form method={"dialog"}>
            <button type={"submit"}>{"Fechar"}</button>
          </form>
        </div>
        <p id={"info-description"}></p>
        <p>
          {
            "Esta é uma loja fictícia. Endereço, horários de funcionamento, prazo e taxa de entrega não estão disponíveis nesta prévia."
          }
        </p>
      </dialog>
      {"\n"}
      <PageBehavior />
    </>
  );
}
