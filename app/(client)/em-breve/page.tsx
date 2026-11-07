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
        <div className="launch-visual">
          <Image
            className="launch-hero-image"
            src="/images/launch-cardap-transparent.png"
            alt="Área do restaurante Cardap em um notebook e um celular, com ilustração de restaurante e formulário de acesso."
            width={1536}
            height={1024}
            sizes="(max-width: 760px) calc(100vw - 48px), 720px"
            preload
          />
        </div>
        <section className="launch-content" aria-labelledby="launch-title">
          <h1 id="launch-title">
            Ainda estamos arrumando a <span>cozinha.</span>
          </h1>
          <p className="launch-description">
            O Cardap vai ajudar seu restaurante a chegar em quem está com fome,
            sem complicação. Falta pouco. Se quiser ser avisado quando abrirmos,
            deixa seu e-mail aqui embaixo.
          </p>
          <LaunchSignup />
        </section>
      </main>
      <footer className="launch-footer">
        <span>Cardap · Sua próxima refeição começa aqui.</span>
        <span>Em desenvolvimento. Feito com cuidado.</span>
      </footer>
    </div>
  );
}
