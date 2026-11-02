import Image from "next/image";
import type { Metadata } from "next";
import BrandLogo from "@/components/brand-logo";
import LaunchSignup from "../_components/launch-signup";
import "../_styles/launch.css";

export const metadata: Metadata = {
  title: "Cardap — Estamos preparando algo especial",
  description:
    "Uma nova plataforma para conectar restaurantes e clientes está chegando. Inscreva-se para receber novidades e acompanhar a abertura do Cardap.",
};

export default function ComingSoonPage() {
  return (
    <div className="launch-page">
      <header className="launch-header">
        <a href="/em-breve" aria-label="Cardap — em breve">
          <BrandLogo />
        </a>
        <span className="launch-header-label">
          <span />
          Feito para aproximar sabores
        </span>
      </header>
      <main id="conteudo" className="launch-main">
        <section className="launch-content" aria-labelledby="launch-title">
          <h1 id="launch-title">
            Seu próximo
            <br />
            grande pedido
            <br />
            começa <span>aqui.</span>
          </h1>
          <p className="launch-description">
            Uma nova forma de conectar seu restaurante a quem está com fome.
            Estamos preparando tudo para receber nossos primeiros parceiros.
          </p>
          <div className="launch-invitation">
            <h2>Seu restaurante pode fazer parte.</h2>
            <p>
              Entre na lista de interesse para receber novidades e saber quando
              o acesso estiver disponível.
            </p>
          </div>
          <LaunchSignup />
        </section>
        <aside
          className="launch-visual"
          aria-label="Uma prévia do que estamos preparando"
        >
          <Image
            className="launch-hero-image"
            src="/images/launch-restaurant.png"
            alt="Restaurante com toldo laranja ao lado de um celular com cardápio e uma sacola de delivery."
            width={1122}
            height={1402}
            sizes="(max-width: 760px) calc(100vw - 56px), (max-width: 1280px) 45vw, 520px"
            preload
          />
        </aside>
      </main>
      <footer className="launch-footer">
        <span>Cardap · Sua próxima refeição começa aqui.</span>
        <span>Em desenvolvimento. Feito com cuidado.</span>
      </footer>
    </div>
  );
}
