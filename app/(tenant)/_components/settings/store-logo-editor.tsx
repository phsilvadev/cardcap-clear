"use client";
import Image from "next/image";
import { useStoreLogo } from "@/app/(tenant)/_hooks/use-store-logo";
import SuccessAlert from "../feedback/success-alert";
export default function StoreLogoEditor({ storeId }: { storeId?: string }) {
  const logo = useStoreLogo(storeId);
  return (
    <section className="store-logo-editor" aria-labelledby="store-logo-heading">
      <div className="store-logo-heading">
        <h3 id="store-logo-heading">Logo da loja</h3>
        <p>Adicione a imagem que representa o seu restaurante.</p>
      </div>
      <div className="store-logo-controls">
        <div
          className={`store-logo-preview${logo.loading ? " is-loading" : ""}`}
          aria-busy={logo.loading}
        >
          {logo.preview || logo.logo ? (
            <Image
              src={logo.preview || logo.logo}
              alt="Logo da loja"
              width={96}
              height={96}
              unoptimized
            />
          ) : (
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-label="Nenhuma logo cadastrada"
            >
              <rect x="3" y="3" width="18" height="18" rx="4" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          )}
        </div>
        <div>
          <input
            ref={logo.input}
            id="store-logo-file"
            aria-label="Selecionar logo da loja"
            tabIndex={-1}
            className="sr-only"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={logo.loading || logo.saving || !logo.canManage}
            onChange={(event) => {
              void logo.select(event);
            }}
          />
          <div className="store-logo-actions">
            <button
              type="button"
              className="button"
              disabled={logo.loading || logo.saving || !logo.canManage}
              onClick={() => logo.input.current?.click()}
            >
              {logo.logo || logo.file ? "Trocar imagem" : "Escolher imagem"}
            </button>
            {logo.file && (
              <button
                className="button primary"
                type="button"
                disabled={logo.saving}
                onClick={() => {
                  void logo.save();
                }}
              >
                {logo.saving ? "Salvando…" : "Salvar logo"}
              </button>
            )}
            {logo.file ? (
              <button
                className="text-button"
                type="button"
                disabled={logo.saving}
                onClick={logo.discard}
              >
                Descartar
              </button>
            ) : (
              logo.logo && (
                <button
                  className="text-button"
                  type="button"
                  disabled={logo.saving || !logo.canManage}
                  onClick={() => {
                    void logo.save(true);
                  }}
                >
                  {logo.saving ? "Removendo…" : "Remover logo"}
                </button>
              )
            )}
          </div>
          <p className="store-logo-hint">
            JPG, PNG ou WebP, até 2 MB. Prefira uma imagem quadrada.
          </p>
          {logo.file && <p className="store-logo-filename">{logo.file.name}</p>}
        </div>
      </div>
      {!logo.loading && !logo.canManage && !logo.error && (
        <p className="store-logo-hint">
          Conclua o cadastro da loja para adicionar a logo.
        </p>
      )}
      {logo.error && (
        <p className="store-logo-error" role="alert">
          {logo.error}
        </p>
      )}
      <SuccessAlert
        open={logo.success}
        title="Logo atualizada!"
        description="A alteração foi salva nos dados da sua loja."
        onClose={logo.closeSuccess}
      />
    </section>
  );
}
