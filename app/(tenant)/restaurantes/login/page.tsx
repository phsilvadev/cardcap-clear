import BrandLogo from "@/components/brand-logo";
import Image from "next/image";
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
    if (
      tenant?.slug === session.slug ||
      (!tenant &&
        isCentralHost(host) &&
        process.env.AUTH_TENANT_SUBDOMAIN_LOGIN !== "true")
    ) {
      redirect("/dashboard");
    }
  }

  return (
    <div className="restaurant-login-shell">
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
      <a className="sr-only focus:not-sr-only" href="#login-restaurante">
        Ir para o conteúdo
      </a>
      <header className="restaurant-login-header">
        <a className="wordmark text-3xl" href="/" aria-label="Cardap — início">
          <BrandLogo />
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
            Mais perto de quem
            <br />
            tem <span>fome.</span>
          </h1>
          <p>
            Acesse sua área para acompanhar pedidos, cuidar do cardápio e
            organizar o dia a dia do seu restaurante.
          </p>
          <span className="hashtag text-3xl text-brand">#PARTIUCOMER</span>
          <Image
            className="restaurant-login-art"
            src="/Restaurante Aconchegante com Entrega.png"
            alt="Restaurante Cardap com sacola de entrega e lista de pedidos"
            width={1536}
            height={1024}
            sizes="(min-width: 1000px) 600px, (min-width: 761px) 50vw, 90vw"
            priority
          />
        </section>
        <section
          className="restaurant-login-card"
          aria-labelledby="login-heading"
        >
          <p className="restaurant-login-eyebrow">Área do restaurante</p>
          <h2 id="login-heading">Bom ter você por aqui.</h2>
          <p>Entre com o e-mail da sua conta.</p>
          <RestaurantLogin />
          <p className="restaurant-login-signup">
            Ainda não tem uma conta?{" "}
            <a href="/restaurantes/cadastro" className="hover:underline">
              Cadastrar restaurante
            </a>
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
}
