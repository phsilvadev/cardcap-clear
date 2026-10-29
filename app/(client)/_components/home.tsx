import Image from "next/image";
import PageBehavior from "@/app/(client)/_components/home-behavior";

export default function HomeContent() {
  return (
    <>
      <a href={"#conteudo"} className={"sr-only focus:not-sr-only"}>
        {"Ir para o conteúdo"}
      </a>

      <div className={"mx-auto max-w-6xl px-5 sm:px-8"}>
        <header
          className={
            "flex flex-wrap items-center justify-between gap-5 border-b border-line py-6 lg:border-0 lg:py-8"
          }
        >
          <a
            href={"#"}
            aria-label={"Cardap — início"}
            className={"wordmark text-3xl"}
          >
            {"cardap"}
            <span className={"text-brand"}>{"."}</span>
          </a>

          <nav
            aria-label={"Navegação principal"}
            className={"flex flex-wrap items-center gap-4 text-sm sm:gap-8"}
          >
            <a href={"/cliente"}>{"Minha conta"}</a>
            <a href={"#como-funciona"} className={"hover:underline"}>
              {"Como funciona"}
            </a>

            <a
              href="/restaurantes/login"
              className={"border-0 bg-transparent p-0 hover:underline"}
            >
              {"Para restaurantes"}
            </a>

            <button
              type={"button"}
              data-info={"login"}
              className={
                "rounded-full border border-ink bg-ink px-5 py-3 text-white hover:bg-white hover:text-ink"
              }
            >
              {"Entrar "}
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
                style={{ display: "inline-block", verticalAlign: "middle" }}
              >
                <path d={"M7 7h10v10"}></path>
                <path d={"M7 17 17 7"}></path>
              </svg>
            </button>
          </nav>
        </header>

        <main id={"conteudo"}>
          <section
            className={
              "grid items-center gap-10 py-10 lg:grid-cols-2 lg:gap-14 lg:py-14"
            }
            aria-labelledby={"hero-title"}
          >
            <div>
              <p
                className={
                  "mb-5 text-xs font-semibold uppercase tracking-[0.25em] text-muted"
                }
              >
                {"Sua cidade. Seus sabores."}
              </p>

              <h1
                id={"hero-title"}
                className={
                  "text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl"
                }
              >
                {"Deu fome?"}
                <br />
                {"O próximo sabor"}
                <br />
                {"está "}
                <span className={"text-brand"}>{"por perto."}</span>
              </h1>

              <p
                className={"mt-6 max-w-md text-base leading-relaxed text-muted"}
              >
                {
                  "Descubra os restaurantes da sua região. Escolha sua cidade e dê o primeiro passo para encontrar sua próxima refeição."
                }
              </p>

              <a
                href={"#buscar"}
                className={
                  "mt-7 inline-flex min-h-12 items-center gap-6 rounded-full border border-ink px-6 text-sm font-semibold hover:bg-ink hover:text-white"
                }
              >
                {"Encontrar restaurantes "}
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
                  className={"lucide lucide-arrow-down"}
                  aria-hidden={"true"}
                  focusable={"false"}
                  style={{ display: "inline-block", verticalAlign: "middle" }}
                >
                  <path d={"M12 5v14"}></path>
                  <path d={"m19 12-7 7-7-7"}></path>
                </svg>
              </a>

              <p className={"hashtag mt-8 text-3xl text-brand"}>
                {"#PARTIUCOMER"}
              </p>
            </div>

            <div
              className="flex min-h-80 items-center justify-center py-6 sm:min-h-96"
              aria-hidden="true"
            >
              <Image
                src="/i01.png"
                alt=""
                width={1477}
                height={1065}
                sizes="(min-width: 1024px) 536px, (min-width: 640px) 50vw, 100vw"
                className="home-hero-image"
                priority
              />
            </div>
          </section>

          <section
            id={"buscar"}
            aria-labelledby={"search-title"}
            className={"scroll-mt-6 rounded-3xl border border-line p-5 sm:p-8"}
          >
            <div
              className={"mb-6 flex flex-wrap items-end justify-between gap-3"}
            >
              <div>
                <p
                  className={
                    "text-xs font-semibold uppercase tracking-widest text-muted"
                  }
                >
                  {"Vamos começar"}
                </p>
                <h2
                  id={"search-title"}
                  className={"mt-2 text-2xl font-bold sm:text-3xl"}
                >
                  {"Onde bateu a fome?"}
                </h2>
              </div>
              <p className={"text-sm text-muted"}>
                {"Escolha sua cidade e seu estado."}
              </p>
            </div>

            <form
              id={"location-form"}
              className={"grid gap-4 sm:grid-cols-[minmax(0,1fr)_120px_auto]"}
            >
              <div className={"rounded-2xl border border-line px-4 py-3"}>
                <label
                  htmlFor={"city"}
                  className={"block text-xs font-medium text-muted"}
                >
                  {"Cidade"}
                </label>
                <input
                  id={"city"}
                  name={"city"}
                  autoComplete={"address-level2"}
                  placeholder={"Ex.: São Paulo"}
                  maxLength={100}
                  required={true}
                  className={
                    "mt-1 w-full min-w-0 border-0 bg-transparent text-base outline-none"
                  }
                />
              </div>

              <div className={"rounded-2xl border border-line px-4 py-3"}>
                <label
                  htmlFor={"state"}
                  className={"block text-xs font-medium text-muted"}
                >
                  {"Estado"}
                </label>
                <select
                  id={"state"}
                  name={"state"}
                  autoComplete={"address-level1"}
                  required={true}
                  className={"mt-1 w-full border-0 bg-transparent text-base"}
                >
                  <option value={""}>{"UF"}</option>
                </select>
              </div>

              <button
                type={"submit"}
                className={
                  "flex min-h-14 items-center justify-center gap-4 rounded-full border-0 bg-brand px-8 font-semibold hover:bg-ink hover:text-white"
                }
              >
                {"Buscar "}
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
                  style={{ display: "inline-block", verticalAlign: "middle" }}
                >
                  <path d={"m21 21-4.34-4.34"}></path>
                  <circle cx={"11"} cy={"11"} r={"8"}></circle>
                </svg>
              </button>
            </form>

            <p
              id={"search-feedback"}
              role={"status"}
              aria-live={"polite"}
              className={"mt-3 min-h-5 text-sm text-muted"}
            ></p>

            <p className={"mt-1 text-xs text-muted"}>
              {
                "Prévia visual: explore uma listagem demonstrativa de restaurantes na região escolhida."
              }
            </p>
          </section>

          <section
            id={"como-funciona"}
            aria-labelledby={"steps-title"}
            className={"py-12 sm:py-16"}
          >
            <div
              className={"mb-8 flex flex-wrap items-end justify-between gap-3"}
            >
              <h2 id={"steps-title"} className={"text-3xl font-bold"}>
                {"Perto de você."}
                <br />
                {"Simples assim."}
              </h2>
              <p className={"max-w-xs text-sm leading-relaxed text-muted"}>
                {
                  "Tudo começa com o lugar onde você está e a vontade de comer bem."
                }
              </p>
            </div>

            <ol className={"m-0 grid list-none gap-6 p-0 sm:grid-cols-3"}>
              <li className={"border-t border-line pt-5"}>
                <span className={"hashtag text-3xl text-brand"}>{"01"}</span>
                <h3 className={"mt-3 text-lg font-bold"}>
                  {"Escolha sua região"}
                </h3>
                <p className={"mt-2 text-sm leading-relaxed text-muted"}>
                  {"Informe sua cidade e seu estado para começar."}
                </p>
              </li>

              <li className={"border-t border-line pt-5"}>
                <span className={"hashtag text-3xl text-brand"}>{"02"}</span>
                <h3 className={"mt-3 text-lg font-bold"}>
                  {"Descubra restaurantes"}
                </h3>
                <p className={"mt-2 text-sm leading-relaxed text-muted"}>
                  {
                    "A proposta do Cardap é conectar você aos sabores da sua região."
                  }
                </p>
              </li>

              <li className={"border-t border-line pt-5"}>
                <span className={"hashtag text-3xl text-brand"}>{"03"}</span>
                <h3 className={"mt-3 text-lg font-bold"}>
                  {"Encontre sua próxima refeição"}
                </h3>
                <p className={"mt-2 text-sm leading-relaxed text-muted"}>
                  {
                    "Seu lugar de sempre ou uma nova descoberta: a escolha começa aqui."
                  }
                </p>
              </li>
            </ol>
          </section>

          <section
            className={
              "mb-12 flex flex-wrap items-center justify-between gap-6 rounded-3xl bg-ink p-6 text-white sm:p-8"
            }
            aria-labelledby={"partner-title"}
          >
            <div>
              <p
                className={
                  "text-xs font-semibold uppercase tracking-widest text-brand"
                }
              >
                {"Para quem faz acontecer"}
              </p>
              <h2 id={"partner-title"} className={"mt-2 text-2xl font-bold"}>
                {"Seu restaurante também pode estar perto."}
              </h2>
              <p className={"mt-2 text-sm text-white/70"}>
                {"Conheça a área de parceiros do Cardap."}
              </p>
            </div>
            <a
              href="/restaurantes/login"
              className={
                "min-h-12 shrink-0 rounded-full border-0 bg-brand px-6 font-semibold text-ink hover:bg-white"
              }
            >
              {"Conhecer a área de parceiros "}
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
                style={{ display: "inline-block", verticalAlign: "middle" }}
              >
                <path d={"M7 7h10v10"}></path>
                <path d={"M7 17 17 7"}></path>
              </svg>
            </a>
          </section>
        </main>

        <footer
          className={
            "flex flex-wrap items-center justify-between gap-5 border-t border-line py-7 text-xs text-muted"
          }
        >
          <a className={"wordmark text-2xl text-ink"} href={"#"}>
            {"cardap"}
            <span className={"text-brand"}>{"."}</span>
          </a>
          <p>{"Cardap · Sua próxima refeição começa aqui."}</p>
          <button
            type={"button"}
            data-info={"about"}
            className={"min-h-11 border-0 bg-transparent p-0 hover:underline"}
          >
            {"Sobre esta prévia"}
          </button>
        </footer>
      </div>

      <dialog
        id={"info-dialog"}
        aria-labelledby={"dialog-title"}
        aria-describedby={"dialog-description"}
      >
        <h2 id={"dialog-title"} className={"text-2xl font-bold"}></h2>
        <p
          id={"dialog-description"}
          className={"mt-4 text-sm leading-relaxed text-muted"}
        ></p>
        <form method={"dialog"} className={"mt-6"}>
          <button
            className={"min-h-11 rounded-full border-0 bg-ink px-6 text-white"}
          >
            {"Entendi"}
          </button>
        </form>
      </dialog>
      {"\n\n"}
      <PageBehavior />
    </>
  );
}
