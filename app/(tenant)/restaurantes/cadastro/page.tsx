import type { Metadata } from "next";
import RestaurantSignup from "@/app/(tenant)/_components/restaurant-signup";
import "@/app/(tenant)/_styles/restaurant-login.css";
import "@/app/(tenant)/_styles/restaurant-signup.css";

export const metadata: Metadata = {
  title: "Cadastrar restaurante — Cardap",
  description: "Comece o cadastro do seu restaurante no Cardap.",
};

const Page = () => (
  <div className="restaurant-login-shell">
    <a className="sr-only focus:not-sr-only" href="#cadastro-restaurante">
      Ir para o conteúdo
    </a>
    <header className="restaurant-login-header">
      <a className="wordmark text-3xl" href="/" aria-label="Cardap — início">
        cardap<span className="text-brand">.</span>
      </a>
      <a href="/restaurantes/login">Voltar ao login</a>
    </header>
    <main id="cadastro-restaurante" className="restaurant-login-main">
      <section
        className="restaurant-login-intro"
        aria-labelledby="signup-heading"
      >
        <p className="restaurant-login-eyebrow">
          Seu próximo passo começa aqui
        </p>
        <h1 id="signup-heading">
          Seu sabor merece
          <br />
          estar por perto.
        </h1>
        <p>
          Apresente seu restaurante a quem está com fome. Comece com os dados do
          responsável e da sua conta.
        </p>
        <span className="hashtag text-3xl text-brand">#PARTIUCOMER</span>
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
      Cardap · Sua próxima refeição começa aqui.
    </footer>
  </div>
);

export default Page;
