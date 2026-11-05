import BrandLogo from "@/components/brand-logo";
import Image from "next/image";
import HomeAccountLink from "./home-account-link";
import PageBehavior from "./home-behavior";
import "../_styles/home.css";

function Icon({
  kind,
  size = 22,
}: {
  kind: "search" | "pin" | "store" | "arrow" | "food";
  size?: number;
}) {
  const paths = {
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 5 5" />
      </>
    ),
    pin: (
      <>
        <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    store: (
      <>
        <path d="m3 9 3-6h12l3 6M3 9h18M5 9v12h14V9M9 21v-7h6v7" />
      </>
    ),
    arrow: <path d="M7 17 17 7M7 7h10v10" />,
    food: (
      <>
        <path d="M3 2v7a3 3 0 0 0 6 0V2M6 2v20M18 22V2c-5 3-5 11 0 11M22 2v20" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[kind]}
    </svg>
  );
}
const steps = [
  {
    image: "Mapa dobrado com pino laranja.png",
    title: "Escolha sua região",
    description: "Informe sua cidade e estado para começar.",
  },
  {
    image: "Loja Charmosa com Toldinho Listrado.png",
    title: "Descubra restaurantes",
    description: "Acesse os restaurantes disponíveis e explore os cardápios.",
  },
  {
    image: "Ícone de Hambúrguer 3D Brilhante.png",
    title: "Encontre sua próxima refeição",
    description: "Escolha, faça seu pedido e aproveite.",
  },
];
export default function HomeContent({
  restaurant,
}: {
  restaurant?: { name: string; href: string };
}) {
  return (
    <div className="home-page">
      <a href="#conteudo" className="home-skip">
        Ir para o conteúdo
      </a>
      <div className="home-container">
        <header className="home-header">
          <a href="/" aria-label="Cardap — início">
            <BrandLogo />
          </a>
          <nav aria-label="Navegação principal">
            <a href="/cliente">Minha conta</a>
            <a href="#como-funciona">Como funciona</a>
            <HomeAccountLink restaurant={restaurant} />
          </nav>
        </header>
        <main id="conteudo">
          <section className="home-hero" aria-labelledby="hero-title">
            <div className="home-hero-copy">
              <p className="home-eyebrow">Sua cidade. Seus sabores.</p>
              <h1 id="hero-title">
                Deu fome?
                <br />O próximo sabor
                <br />
                está <span>por perto.</span>
              </h1>
              <p className="home-intro">
                Encontre os melhores restaurantes da sua região, explore
                cardápios, faça seu pedido e receba com praticidade.
              </p>
              <div className="home-actions">
                <a href="#buscar" className="home-button home-primary">
                  <Icon kind="search" size={19} />
                  Encontrar restaurantes
                </a>
                <a
                  href="/restaurantes/cadastro"
                  className="home-button home-secondary"
                >
                  <Icon kind="store" />
                  Cadastrar restaurante
                </a>
              </div>
            </div>
            <Image
              className="home-art"
              src="/Restaurante Cardap com Entrega.png"
              alt="Restaurante Cardap com entregador de moto e sacola de delivery"
              width={1448}
              height={1086}
              sizes="(min-width: 900px) 52vw, 100vw"
              priority
            />
          </section>
          <section
            id="buscar"
            className="home-search"
            aria-labelledby="search-title"
          >
            <div className="home-search-heading">
              <div>
                <p className="home-kicker">Vamos começar</p>
                <h2 id="search-title">Onde bateu a fome?</h2>
              </div>
              <p className="home-search-hint">
                <Icon kind="food" size={31} />
                Escolha sua cidade e encontre restaurantes perto de você.
              </p>
            </div>
            <form
              id="location-form"
              className="home-search-form"
              action="/restaurantes"
              method="get"
            >
              <div className="home-location-fields">
                <Icon kind="pin" size={26} />
                <div className="home-city">
                  <label htmlFor="city">Cidade</label>
                  <input
                    id="city"
                    name="city"
                    autoComplete="address-level2"
                    placeholder="Ex.: São Paulo"
                    maxLength={100}
                    required
                  />
                </div>
                <div className="home-state">
                  <label htmlFor="state">Estado</label>
                  <select
                    id="state"
                    name="state"
                    autoComplete="address-level1"
                    required
                  >
                    <option value="">UF</option>
                    {"AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO"
                      .split(" ")
                      .map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              <button type="submit" className="home-button home-primary">
                <Icon kind="search" size={29} />
                Buscar
              </button>
            </form>
            <p id="search-feedback" role="status" aria-live="polite" />
          </section>
          <section
            id="como-funciona"
            className="home-how"
            aria-labelledby="steps-title"
          >
            <h2 id="steps-title">Como funciona?</h2>
            <p className="home-how-intro">
              É simples, rápido e você encontra o que tem de melhor na sua
              região.
            </p>
            <ol className="home-steps">
              {steps.map((step, index) => (
                <li key={step.title}>
                  <Image
                    src={`/${step.image}`}
                    alt=""
                    width={120}
                    height={120}
                    sizes="110px"
                  />
                  <span className="home-step-number">0{index + 1}</span>
                  <div className="home-step-copy">
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </div>
                  {index < 2 && (
                    <span className="home-step-next" aria-hidden="true">
                      ›
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </section>
          <section className="home-partners" aria-labelledby="partner-title">
            <Image
              src="/Ícone 3D de loja com toldo listrado.png"
              alt=""
              width={185}
              height={150}
              sizes="170px"
            />
            <div>
              <p className="home-kicker">Para restaurantes</p>
              <h2 id="partner-title">
                Seu restaurante também pode estar no Cardap.
              </h2>
              <p>
                Mais visibilidade, pedidos organizados e clientes na sua região.
              </p>
            </div>
            <a href="/restaurantes/login" className="home-button home-primary">
              Conhecer a área de parceiros <Icon kind="arrow" size={19} />
            </a>
          </section>
        </main>
        <footer className="home-footer">
          <a href="/" aria-label="Cardap — início">
            <BrandLogo />
          </a>
          <p>Cardap · Sua próxima refeição começa aqui.</p>
          <nav aria-label="Informações">
            <button type="button" data-info="about">
              Sobre
            </button>
            <button type="button" data-info="terms">
              Termos
            </button>
            <button type="button" data-info="privacy">
              Privacidade
            </button>
            <button type="button" data-info="contact">
              Contato
            </button>
          </nav>
        </footer>
      </div>
      <dialog
        id="info-dialog"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
      >
        <h2 id="dialog-title" />
        <p id="dialog-description" />
        <form method="dialog">
          <button className="home-button home-primary">Entendi</button>
        </form>
      </dialog>
      <PageBehavior />
    </div>
  );
}
