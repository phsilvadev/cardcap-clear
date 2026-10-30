import BrowserHomeLink from "@/app/(tenant)/_components/browser-home-link";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTenantSession } from "@/lib/auth/session";
import { isCentralHost, resolveTenant } from "@/lib/tenant";
import RestaurantLogin from "@/app/(tenant)/_components/restaurant-login";
import "@/app/(tenant)/_styles/restaurant-login.css";

export const metadata: Metadata = {
  title: "Entrar no restaurante — Cardap",
  description: "Acesse a área do seu restaurante no Cardap.",
};

export default async function Page() {
  const session = await getTenantSession();
  if (session) {
    const host = (await headers()).get("host") ?? "";
    const tenant = resolveTenant(host);
    if (tenant?.slug === session.slug || (!tenant && isCentralHost(host))) {
      redirect("/dashboard");
    }
  }

  return (
    <div className="restaurant-login-shell">
      <a className="sr-only focus:not-sr-only" href="#login-restaurante">
        Ir para o conteúdo
      </a>
      <header className="restaurant-login-header">
        <a className="wordmark text-3xl" href="/" aria-label="Cardap — início">
          cardap<span className="text-brand">.</span>
        </a>
        <BrowserHomeLink />
      </header>
      <main id="login-restaurante" className="restaurant-login-main">
        <section
          className="restaurant-login-intro"
          aria-labelledby="partner-heading"
        >
          <p className="restaurant-login-eyebrow">Para quem faz acontecer</p>
          <h1 id="partner-heading">
            Seu restaurante.
            <br />
            Mais perto de quem tem fome.
          </h1>
          <p>
            Acesse sua área para acompanhar pedidos, cuidar do cardápio e
            organizar o dia a dia do seu restaurante.
          </p>
          <span className="hashtag text-3xl text-brand">#PARTIUCOMER</span>
        </section>
        <section
          className="restaurant-login-card"
          aria-labelledby="login-heading"
        >
          <p className="restaurant-login-eyebrow">Área do restaurante</p>
          <h2 id="login-heading">Bom ter você por aqui.</h2>
          <p>Entre com o e-mail da sua conta.</p>
          <RestaurantLogin />
          <p className="restaurant-login-note">
            Ainda não tem uma conta?{" "}
            <a href="/restaurantes/cadastro" className="hover:underline">
              Cadastrar restaurante
            </a>
          </p>
        </section>
      </main>
      <footer className="restaurant-login-footer">
        Cardap · Sua próxima refeição começa aqui.
      </footer>
    </div>
  );
}
