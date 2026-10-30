import type { ReactNode } from "react";
export function CatalogHeader({
  backHref = "/#buscar",
  backLabel = "Alterar região",
}: {
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <>
      <a href="#conteudo" className="sr-only focus:not-sr-only">
        Ir para o conteúdo
      </a>
      <header className="listing-header">
        <a className="wordmark text-3xl" href="/" aria-label="Cardap — início">
          cardap<span className="text-brand">.</span>
        </a>
        <nav className="catalog-nav" aria-label="Navegação do cliente">
          <a href="/cliente">Minha conta</a>
          <a href={backHref} className="link-icon back">
            <span aria-hidden="true">←</span> {backLabel}
          </a>
        </nav>
      </header>
    </>
  );
}
export function CatalogLogo({
  url,
  name,
}: {
  url: string | null;
  name: string;
}) {
  return url ? (
    <img
      src={url}
      alt={`Logo de ${name}`}
      className="catalog-logo"
      loading="lazy"
      onError={(event) => {
        event.currentTarget.style.display = "none";
      }}
    />
  ) : (
    <span className="wordmark catalog-placeholder" aria-hidden="true">
      {name.charAt(0).toLowerCase() || "c"}
      <span className="text-brand">.</span>
    </span>
  );
}
export function CatalogStatus({
  receiving,
  unknown = false,
}: {
  receiving: boolean;
  unknown?: boolean;
}) {
  return (
    <span
      className={`catalog-status ${receiving && !unknown ? "is-open" : ""}`}
    >
      <span aria-hidden="true" />
      {unknown
        ? "Status indisponível"
        : receiving
          ? "Recebendo pedidos"
          : "Recebimento pausado"}
    </span>
  );
}
export function CatalogMessage({
  title,
  children,
  action,
  label = "Tentar novamente",
  headingLevel = 2,
}: {
  title: string;
  children?: ReactNode;
  action?: () => void;
  label?: string;
  headingLevel?: 1 | 2;
}) {
  const Heading = headingLevel === 1 ? "h1" : "h2";
  return (
    <div className="catalog-message" role={action ? "status" : undefined}>
      <Heading>{title}</Heading>
      {children && <p>{children}</p>}
      {action && (
        <button type="button" className="catalog-button" onClick={action}>
          {label}
        </button>
      )}
    </div>
  );
}
export function CatalogSkeleton({ products = false }: { products?: boolean }) {
  return (
    <div
      role="status"
      className={products ? "catalog-products" : "restaurants"}
      aria-label={products ? "Carregando cardápio" : "Carregando lojas"}
    >
      {Array.from({ length: products ? 4 : 6 }, (_, index) => (
        <div key={index} className="catalog-skeleton" aria-hidden="true">
          <div className="catalog-skeleton-art" />
          <div className="catalog-skeleton-line" />
          <div className="catalog-skeleton-line short" />
        </div>
      ))}
    </div>
  );
}
export function CatalogFooter() {
  return (
    <footer className="catalog-footer">
      <a href="/" className="wordmark">
        cardap<span className="text-brand">.</span>
      </a>
      <span>Sua cidade. Seus sabores.</span>
    </footer>
  );
}
