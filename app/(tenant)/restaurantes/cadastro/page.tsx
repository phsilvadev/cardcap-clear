import BrandLogo from "@/components/brand-logo";
import Image from "next/image";
import SignupIcon from "@/app/(tenant)/_components/signup-icon";
import type { Metadata } from "next";
import RestaurantSignup from "@/app/(tenant)/_components/restaurant-signup";
import "@/app/(tenant)/_styles/restaurant-login.css";
import "@/app/(tenant)/_styles/restaurant-signup.css";

export const metadata: Metadata = {
  title: "Cadastrar restaurante — Cardap",
  description: "Comece o cadastro do seu restaurante no Cardap.",
};

const Page = () => (
  <div className="restaurant-login-shell restaurant-signup-shell">
    <svg
      className="restaurant-login-wave restaurant-login-wave-top"
      viewBox="0 0 260 200"
      aria-hidden="true"
    >
      <path fill="#ffe7ca" d="M0 0h260C139 22 166 117 78 164L0 200Z" />
      <path
        fill="#ff9800"
        d="M0 0h245C109 22 95 35 60 94 43 122 20 142 0 153Z"
      />
    </svg>
    <svg
      className="restaurant-login-wave restaurant-login-wave-bottom"
      viewBox="0 0 260 200"
      aria-hidden="true"
    >
      <path fill="#ffe1b9" d="M0 0h260C139 22 166 117 78 164L0 200Z" />
      <path
        fill="#ffab35"
        d="M0 0h245C109 22 95 35 60 94 43 122 20 142 0 153Z"
      />
    </svg>
    <a className="sr-only focus:not-sr-only" href="#cadastro-restaurante">
      Ir para o conteúdo
    </a>
    <header className="restaurant-login-header">
      <a className="wordmark text-3xl" href="/" aria-label="Cardap — início">
        <BrandLogo />
      </a>
      <a href="/restaurantes/login">
        <SignupIcon name="arrow" />
        Voltar ao login
      </a>
    </header>
    <main id="cadastro-restaurante" className="restaurant-login-main">
      <section
        className="restaurant-login-intro"
        aria-labelledby="signup-heading"
      >
        <p className="restaurant-signup-badge">
          <SignupIcon name="store" />
          Cadastre seu restaurante
        </p>
        <h1 id="signup-heading">
          Seu sabor merece
          <br />
          estar <span>por perto.</span>
        </h1>
        <p>
          Cadastre seu restaurante, organize seu cardápio, receba pedidos online
          e aumente suas vendas na sua cidade.
        </p>
        <ul className="restaurant-signup-benefits">
          {[
            "Receba pedidos online",
            "Gerencie seu cardápio",
            "Acompanhe suas vendas",
            "Tudo em um só lugar",
          ].map((benefit) => (
            <li key={benefit}>
              <span aria-hidden="true">✓</span>
              {benefit}
            </li>
          ))}
        </ul>
        <Image
          className="restaurant-signup-art"
          src="/Restaurante Aconchegante com Entrega.png"
          alt="Restaurante Cardap com sacola de entrega e lista de pedidos"
          width={1536}
          height={1024}
          sizes="(min-width: 1000px) 550px, 90vw"
          priority
        />
      </section>
      <section
        className="restaurant-login-card"
        aria-labelledby="signup-form-heading"
      >
        <p className="restaurant-login-eyebrow">Novo restaurante</p>
        <h2 id="signup-form-heading">Vamos começar?</h2>
        <p>Preencha os dados iniciais do seu restaurante.</p>
        <RestaurantSignup />
        <p className="restaurant-signup-switch">
          Já tem uma conta? <a href="/restaurantes/login">Entrar</a>
        </p>
      </section>
    </main>
    <footer className="restaurant-login-footer">
      <BrandLogo />
      <span aria-hidden="true">|</span>
      <p>Sua próxima refeição começa aqui.</p>
    </footer>
  </div>
);

export default Page;
