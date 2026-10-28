import PageBehavior from "@/app/(client)/_components/restaurantes-behavior";

export default function RestaurantesContent() {
  return (
    <>
      {"\n"}
      <a href={"#conteudo"} className={"sr-only focus:not-sr-only"}>
        {"Ir para o conteúdo"}
      </a>
      {"\n"}
      <div className={"shell"}>
        <header className={"listing-header"}>
          <a
            href={"/"}
            aria-label={"Cardap — início"}
            className={"wordmark text-3xl"}
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
            <a href={"/#buscar"} className={"link-icon back"}>
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
              {" Alterar região"}
            </a>
          </nav>
        </header>
        {"\n"}
        <main id={"conteudo"}>
          <section className={"intro"} aria-labelledby={"page-title"}>
            <p className={"eyebrow"}>{"Sua cidade. Seus sabores."}</p>
            <h1 id={"page-title"}>
              {"Sua próxima refeição"}
              <br />
              {"está "}
              <span className={"text-brand"}>{"por aqui."}</span>
            </h1>
            <p className={"text-muted"}>
              {
                "Explore sabores, descubra novos lugares e encontre o que combina com sua fome."
              }
            </p>
            <div className={"intro-bottom"}>
              <span className={"region-pill"}>
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
                <span id={"region"}>{"Escolha sua região"}</span>
              </span>
              <span className={"hashtag text-brand text-2xl"}>
                {"#PARTIUCOMER"}
              </span>
            </div>
          </section>
          {"\n"}
          <section className={"filters"} aria-label={"Filtrar restaurantes"}>
            <div className={"search-row"}>
              <label className={"search-field"} htmlFor={"restaurant-search"}>
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
                <span className={"sr-only"}>
                  {"Buscar restaurante pelo nome"}
                </span>
                <input
                  id={"restaurant-search"}
                  type={"search"}
                  placeholder={"Qual restaurante você procura?"}
                  maxLength={100}
                />
              </label>
              <span className={"filter-label"}>
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
                  className={"lucide lucide-sliders-horizontal"}
                  aria-hidden={"true"}
                  focusable={"false"}
                >
                  <path d={"M10 5H3"}></path>
                  <path d={"M12 19H3"}></path>
                  <path d={"M14 3v4"}></path>
                  <path d={"M16 17v4"}></path>
                  <path d={"M21 12h-9"}></path>
                  <path d={"M21 19h-5"}></path>
                  <path d={"M21 5h-7"}></path>
                  <path d={"M8 10v4"}></path>
                  <path d={"M8 12H3"}></path>
                </svg>
                {" Do seu jeito"}
              </span>
            </div>
            <div
              className={"categories"}
              role={"group"}
              aria-label={"Categoria"}
            >
              <button
                type={"button"}
                className={"category"}
                data-category={"Todos"}
                aria-pressed={"true"}
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
                {" Todos"}
              </button>
              <button
                type={"button"}
                className={"category"}
                data-category={"Hambúrgueres"}
                aria-pressed={"false"}
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
                  className={"lucide lucide-sandwich"}
                  aria-hidden={"true"}
                  focusable={"false"}
                >
                  <path
                    d={"m2.37 11.223 8.372-6.777a2 2 0 0 1 2.516 0l8.371 6.777"}
                  ></path>
                  <path d={"M21 15a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-5.25"}></path>
                  <path d={"M3 15a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h9"}></path>
                  <path
                    d={"m6.67 15 6.13 4.6a2 2 0 0 0 2.8-.4l3.15-4.2"}
                  ></path>
                  <rect
                    width={"20"}
                    height={"4"}
                    x={"2"}
                    y={"11"}
                    rx={"1"}
                  ></rect>
                </svg>
                {" Hambúrgueres"}
              </button>
              <button
                type={"button"}
                className={"category"}
                data-category={"Pizzas"}
                aria-pressed={"false"}
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
                  className={"lucide lucide-pizza"}
                  aria-hidden={"true"}
                  focusable={"false"}
                >
                  <path d={"m12 14-1 1"}></path>
                  <path d={"m13.75 18.25-1.25 1.42"}></path>
                  <path
                    d={"M17.775 5.654a15.68 15.68 0 0 0-12.121 12.12"}
                  ></path>
                  <path d={"M18.8 9.3a1 1 0 0 0 2.1 7.7"}></path>
                  <path
                    d={
                      "M21.964 20.732a1 1 0 0 1-1.232 1.232l-18-5a1 1 0 0 1-.695-1.232A19.68 19.68 0 0 1 15.732 2.037a1 1 0 0 1 1.232.695z"
                    }
                  ></path>
                </svg>
                {" Pizzas"}
              </button>
              <button
                type={"button"}
                className={"category"}
                data-category={"Brasileira"}
                aria-pressed={"false"}
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
                  className={"lucide lucide-soup"}
                  aria-hidden={"true"}
                  focusable={"false"}
                >
                  <path d={"M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z"}></path>
                  <path d={"M7 21h10"}></path>
                  <path d={"M19.5 12 22 6"}></path>
                  <path
                    d={
                      "M16.25 3c.27.1.8.53.75 1.36-.06.83-.93 1.2-1 2.02-.05.78.34 1.24.73 1.62"
                    }
                  ></path>
                  <path
                    d={
                      "M11.25 3c.27.1.8.53.74 1.36-.05.83-.93 1.2-.98 2.02-.06.78.33 1.24.72 1.62"
                    }
                  ></path>
                  <path
                    d={
                      "M6.25 3c.27.1.8.53.75 1.36-.06.83-.93 1.2-1 2.02-.05.78.34 1.24.74 1.62"
                    }
                  ></path>
                </svg>
                {" Brasileira"}
              </button>
              <button
                type={"button"}
                className={"category"}
                data-category={"Cafés"}
                aria-pressed={"false"}
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
                  className={"lucide lucide-coffee"}
                  aria-hidden={"true"}
                  focusable={"false"}
                >
                  <path d={"M10 2v2"}></path>
                  <path d={"M14 2v2"}></path>
                  <path
                    d={
                      "M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"
                    }
                  ></path>
                  <path d={"M6 2v2"}></path>
                </svg>
                {" Cafés"}
              </button>
              <button
                type={"button"}
                className={"category"}
                data-category={"Sobremesas"}
                aria-pressed={"false"}
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
                  className={"lucide lucide-ice-cream-bowl"}
                  aria-hidden={"true"}
                  focusable={"false"}
                >
                  <path
                    d={
                      "M12 17c5 0 8-2.69 8-6H4c0 3.31 3 6 8 6m-4 4h8m-4-3v3M5.14 11a3.5 3.5 0 1 1 6.71 0"
                    }
                  ></path>
                  <path d={"M12.14 11a3.5 3.5 0 1 1 6.71 0"}></path>
                  <path d={"M15.5 6.5a3.5 3.5 0 1 0-7 0"}></path>
                </svg>
                {" Sobremesas"}
              </button>
            </div>
          </section>
          {"\n"}
          <section aria-labelledby={"results-title"}>
            <div className={"results-heading"}>
              <h2 id={"results-title"}>{"Restaurantes da região"}</h2>
              <p
                id={"result-count"}
                role={"status"}
                aria-live={"polite"}
                className={"text-sm text-muted"}
              ></p>
            </div>
            <div className={"restaurants"} id={"restaurants"}>
              <a
                className={"restaurant"}
                data-name={"Quintal da Mesa"}
                data-category={"Brasileira"}
                href={"/loja?store=Quintal+da+Mesa&category=Brasileira"}
              >
                <div className={"restaurant-art"}>
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
                    className={"lucide lucide-soup"}
                    aria-hidden={"true"}
                    focusable={"false"}
                  >
                    <path d={"M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z"}></path>
                    <path d={"M7 21h10"}></path>
                    <path d={"M19.5 12 22 6"}></path>
                    <path
                      d={
                        "M16.25 3c.27.1.8.53.75 1.36-.06.83-.93 1.2-1 2.02-.05.78.34 1.24.73 1.62"
                      }
                    ></path>
                    <path
                      d={
                        "M11.25 3c.27.1.8.53.74 1.36-.05.83-.93 1.2-.98 2.02-.06.78.33 1.24.72 1.62"
                      }
                    ></path>
                    <path
                      d={
                        "M6.25 3c.27.1.8.53.75 1.36-.06.83-.93 1.2-1 2.02-.05.78.34 1.24.74 1.62"
                      }
                    ></path>
                  </svg>
                  <span className={"sample"}>{"Exemplo"}</span>
                </div>
                <div className={"restaurant-copy"}>
                  <p className={"eyebrow"}>{"Brasileira"}</p>
                  <h3>{"Quintal da Mesa"}</h3>
                  <p className={"text-muted mt-2"}>
                    {"Comida de casa, feita com carinho."}
                  </p>
                  <div className={"card-bottom"}>
                    <span>
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
                      </svg>{" "}
                      <span className={"card-region"}>
                        {"Região selecionada"}
                      </span>
                    </span>
                    <span className={"text-muted"}>{"Ilustrativo"}</span>
                  </div>
                </div>
              </a>
              {"\n"}
              <a
                className={"restaurant"}
                data-name={"Ponto do Burger"}
                data-category={"Hambúrgueres"}
                href={"/loja?store=Ponto+do+Burger&category=Hamb%C3%BArgueres"}
              >
                <div className={"restaurant-art"}>
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
                    className={"lucide lucide-sandwich"}
                    aria-hidden={"true"}
                    focusable={"false"}
                  >
                    <path
                      d={
                        "m2.37 11.223 8.372-6.777a2 2 0 0 1 2.516 0l8.371 6.777"
                      }
                    ></path>
                    <path
                      d={"M21 15a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-5.25"}
                    ></path>
                    <path d={"M3 15a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h9"}></path>
                    <path
                      d={"m6.67 15 6.13 4.6a2 2 0 0 0 2.8-.4l3.15-4.2"}
                    ></path>
                    <rect
                      width={"20"}
                      height={"4"}
                      x={"2"}
                      y={"11"}
                      rx={"1"}
                    ></rect>
                  </svg>
                  <span className={"sample"}>{"Exemplo"}</span>
                </div>
                <div className={"restaurant-copy"}>
                  <p className={"eyebrow"}>{"Hambúrgueres"}</p>
                  <h3>{"Ponto do Burger"}</h3>
                  <p className={"text-muted mt-2"}>
                    {"Seu próximo hambúrguer favorito."}
                  </p>
                  <div className={"card-bottom"}>
                    <span>
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
                      </svg>{" "}
                      <span className={"card-region"}>
                        {"Região selecionada"}
                      </span>
                    </span>
                    <span className={"text-muted"}>{"Ilustrativo"}</span>
                  </div>
                </div>
              </a>
              {"\n"}
              <a
                className={"restaurant"}
                data-name={"Forno & Massa"}
                data-category={"Pizzas"}
                href={"/loja?store=Forno+%26+Massa&category=Pizzas"}
              >
                <div className={"restaurant-art"}>
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
                    className={"lucide lucide-pizza"}
                    aria-hidden={"true"}
                    focusable={"false"}
                  >
                    <path d={"m12 14-1 1"}></path>
                    <path d={"m13.75 18.25-1.25 1.42"}></path>
                    <path
                      d={"M17.775 5.654a15.68 15.68 0 0 0-12.121 12.12"}
                    ></path>
                    <path d={"M18.8 9.3a1 1 0 0 0 2.1 7.7"}></path>
                    <path
                      d={
                        "M21.964 20.732a1 1 0 0 1-1.232 1.232l-18-5a1 1 0 0 1-.695-1.232A19.68 19.68 0 0 1 15.732 2.037a1 1 0 0 1 1.232.695z"
                      }
                    ></path>
                  </svg>
                  <span className={"sample"}>{"Exemplo"}</span>
                </div>
                <div className={"restaurant-copy"}>
                  <p className={"eyebrow"}>{"Pizzas"}</p>
                  <h3>{"Forno & Massa"}</h3>
                  <p className={"text-muted mt-2"}>
                    {"Uma boa pizza sempre reúne."}
                  </p>
                  <div className={"card-bottom"}>
                    <span>
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
                      </svg>{" "}
                      <span className={"card-region"}>
                        {"Região selecionada"}
                      </span>
                    </span>
                    <span className={"text-muted"}>{"Ilustrativo"}</span>
                  </div>
                </div>
              </a>
              {"\n"}
              <a
                className={"restaurant"}
                data-name={"Café da Esquina"}
                data-category={"Cafés"}
                href={"/loja?store=Caf%C3%A9+da+Esquina&category=Caf%C3%A9s"}
              >
                <div className={"restaurant-art"}>
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
                    className={"lucide lucide-coffee"}
                    aria-hidden={"true"}
                    focusable={"false"}
                  >
                    <path d={"M10 2v2"}></path>
                    <path d={"M14 2v2"}></path>
                    <path
                      d={
                        "M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"
                      }
                    ></path>
                    <path d={"M6 2v2"}></path>
                  </svg>
                  <span className={"sample"}>{"Exemplo"}</span>
                </div>
                <div className={"restaurant-copy"}>
                  <p className={"eyebrow"}>{"Cafés"}</p>
                  <h3>{"Café da Esquina"}</h3>
                  <p className={"text-muted mt-2"}>
                    {"Uma pausa com sabor de café."}
                  </p>
                  <div className={"card-bottom"}>
                    <span>
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
                      </svg>{" "}
                      <span className={"card-region"}>
                        {"Região selecionada"}
                      </span>
                    </span>
                    <span className={"text-muted"}>{"Ilustrativo"}</span>
                  </div>
                </div>
              </a>
              {"\n"}
              <a
                className={"restaurant"}
                data-name={"Doce Encontro"}
                data-category={"Sobremesas"}
                href={"/loja?store=Doce+Encontro&category=Sobremesas"}
              >
                <div className={"restaurant-art"}>
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
                    className={"lucide lucide-ice-cream-bowl"}
                    aria-hidden={"true"}
                    focusable={"false"}
                  >
                    <path
                      d={
                        "M12 17c5 0 8-2.69 8-6H4c0 3.31 3 6 8 6m-4 4h8m-4-3v3M5.14 11a3.5 3.5 0 1 1 6.71 0"
                      }
                    ></path>
                    <path d={"M12.14 11a3.5 3.5 0 1 1 6.71 0"}></path>
                    <path d={"M15.5 6.5a3.5 3.5 0 1 0-7 0"}></path>
                  </svg>
                  <span className={"sample"}>{"Exemplo"}</span>
                </div>
                <div className={"restaurant-copy"}>
                  <p className={"eyebrow"}>{"Sobremesas"}</p>
                  <h3>{"Doce Encontro"}</h3>
                  <p className={"text-muted mt-2"}>
                    {"Um doce motivo para ficar por perto."}
                  </p>
                  <div className={"card-bottom"}>
                    <span>
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
                      </svg>{" "}
                      <span className={"card-region"}>
                        {"Região selecionada"}
                      </span>
                    </span>
                    <span className={"text-muted"}>{"Ilustrativo"}</span>
                  </div>
                </div>
              </a>
              {"\n"}
              <a
                className={"restaurant"}
                data-name={"Tempero de Casa"}
                data-category={"Brasileira"}
                href={"/loja?store=Tempero+de+Casa&category=Brasileira"}
              >
                <div className={"restaurant-art"}>
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
                  <span className={"sample"}>{"Exemplo"}</span>
                </div>
                <div className={"restaurant-copy"}>
                  <p className={"eyebrow"}>{"Brasileira"}</p>
                  <h3>{"Tempero de Casa"}</h3>
                  <p className={"text-muted mt-2"}>
                    {"O sabor de uma boa descoberta."}
                  </p>
                  <div className={"card-bottom"}>
                    <span>
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
                      </svg>{" "}
                      <span className={"card-region"}>
                        {"Região selecionada"}
                      </span>
                    </span>
                    <span className={"text-muted"}>{"Ilustrativo"}</span>
                  </div>
                </div>
              </a>
            </div>
            <div id={"empty"} hidden={true}>
              <svg
                xmlns={"http://www.w3.org/2000/svg"}
                width={"32"}
                height={"32"}
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
              <h3>{"Nenhum restaurante por aqui."}</h3>
              <p className={"text-muted"}>
                {"Tente outro nome ou escolha uma categoria diferente."}
              </p>
              <button type={"button"} id={"clear-filters"}>
                {"Limpar filtros"}
              </button>
            </div>
          </section>
          {"\n"}
          <aside className={"notice"}>
            <div>
              <p
                className={"eyebrow"}
                style={{ color: "var(--color-brand)", marginBottom: "8px" }}
              >
                {"Uma prévia do que vem por aí"}
              </p>
              <p>
                {
                  "Estes restaurantes são fictícios e demonstram a listagem da região escolhida. A disponibilidade, os cardápios e os pedidos ainda não estão conectados."
                }
              </p>
            </div>
            <span className={"hashtag"}>{"Bom apetite!"}</span>
          </aside>
        </main>
        {"\n"}
        <footer className={"listing-footer"}>
          <a href={"/"} className={"wordmark text-2xl text-ink"}>
            {"cardap"}
            <span className={"text-brand"}>{"."}</span>
          </a>
          <p>{"Cardap · Sua próxima refeição começa aqui."}</p>
          <a href={"/#buscar"} className={"link-icon"}>
            {"Escolher outra região "}
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
              className={"lucide lucide-arrow-up-right"}
              aria-hidden={"true"}
              focusable={"false"}
            >
              <path d={"M7 7h10v10"}></path>
              <path d={"M7 17 17 7"}></path>
            </svg>
          </a>
        </footer>
      </div>
      {"\n"}
      <PageBehavior />
    </>
  );
}
