"use client";
import { useAsaasVideoTutorial } from "@/app/(tenant)/_hooks/use-asaas-video-tutorial";

export default function AsaasVideoTutorial() {
  const tutorial = useAsaasVideoTutorial();
  return (
    <>
      <button
        type="button"
        className="asaas-video-trigger"
        onClick={tutorial.show}
        aria-haspopup="dialog"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="m10 8 6 4-6 4V8Z" />
        </svg>
        Assistir ao tutorial
      </button>
      <dialog
        ref={tutorial.dialogRef}
        className="asaas-video-modal"
        aria-labelledby="asaas-video-title"
        onCancel={(event) => {
          event.preventDefault();
          tutorial.close();
        }}
      >
        <div className="asaas-video-heading">
          <div>
            <span className="asaas-guide-eyebrow">Ajuda com recebimentos</span>
            <h2 id="asaas-video-title">Configure sua conta Asaas</h2>
          </div>
          <button
            type="button"
            className="asaas-video-close"
            onClick={tutorial.close}
            aria-label="Fechar vídeo"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="m6 6 12 12M6 18 18 6" />
            </svg>
          </button>
        </div>
        <div
          className="asaas-video-topics"
          role="group"
          aria-label="Assunto do tutorial"
        >
          <button
            type="button"
            aria-pressed={tutorial.topic === "account"}
            onClick={() => tutorial.select("account")}
          >
            1. Criar conta
          </button>
          <button
            type="button"
            aria-pressed={tutorial.topic === "wallet"}
            onClick={() => tutorial.select("wallet")}
          >
            2. Wallet ID
          </button>
        </div>
        <h3 className="asaas-video-topic-title">{tutorial.video.title}</h3>
        <p className="asaas-video-description">{tutorial.video.description}</p>
        {tutorial.open && tutorial.video.id ? (
          <>
            <div className="asaas-video-player" aria-busy={tutorial.loading}>
              {tutorial.loading && (
                <span className="asaas-video-loading" role="status">
                  Carregando vídeo…
                </span>
              )}
              <iframe
                key={tutorial.video.id}
                src={`https://www.youtube-nocookie.com/embed/${tutorial.video.id}?rel=0`}
                title={tutorial.video.title}
                allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                onLoad={tutorial.loaded}
              />
            </div>
            <a
              className="asaas-video-external"
              href={`https://www.youtube.com/watch?v=${tutorial.video.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Não conseguiu assistir? Abrir no YouTube{" "}
              <span aria-hidden="true">↗</span>
            </a>
          </>
        ) : tutorial.open ? (
          <div className="asaas-video-placeholder">
            <svg
              width="44"
              height="44"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="16" rx="3" />
              <path d="m10 8 6 4-6 4V8Z" />
            </svg>
            <h4>Vídeo sobre Wallet ID</h4>
            <p>
              Em breve, um passo a passo para encontrar o identificador da sua
              carteira.
            </p>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
