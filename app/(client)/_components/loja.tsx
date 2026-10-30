"use client";
import { useEffect, useState } from "react";
import { usePublicStore } from "../_hooks/use-public-store";
import {
  categoryLabels,
  formatMoney,
  normalizeSearch,
} from "@/lib/storefront/types";
import {
  CatalogHeader,
  CatalogLogo,
  CatalogStatus,
  CatalogSkeleton,
  CatalogMessage,
  CatalogFooter,
} from "./catalog-shared";
export default function LojaContent({
  slug,
  preview,
  city,
  state,
}: {
  slug: string;
  preview: boolean;
  city: string;
  state: string;
}) {
  const catalog = usePublicStore(slug, preview);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const store = catalog.data?.store;
  const region = new URLSearchParams();
  if (city && state) {
    region.set("city", city);
    region.set("state", state);
  } else if (store) {
    region.set("city", store.city);
    region.set("state", store.state);
  }
  const backHref =
    "/restaurantes" + (region.size ? "?" + region.toString() : "");
  useEffect(() => {
    if (store?.name) document.title = `${store.name} — Cardap`;
  }, [store?.name]);
  const products =
    catalog.data?.products.filter(
      (product) =>
        (!category || product.categoryId === category) &&
        normalizeSearch(`${product.name} ${product.description}`).includes(
          normalizeSearch(search),
        ),
    ) ?? [];
  return (
    <div className="shell public-catalog">
      <CatalogHeader backHref={backHref} backLabel="Restaurantes" />
      <main id="conteudo">
        {catalog.loading ? (
          <div className="catalog-store-loading">
            <CatalogSkeleton products />
          </div>
        ) : !store ? (
          <CatalogMessage
            headingLevel={1}
            title={slug ? "Loja indisponível" : "Escolha um restaurante"}
            action={slug ? catalog.reload : undefined}
          >
            {catalog.error || (
              <a href={backHref}>
                Veja os restaurantes disponíveis na sua região.
              </a>
            )}
          </CatalogMessage>
        ) : (
          <>
            {catalog.data?.preview && (
              <p className="catalog-preview" role="status">
                Prévia da sua loja. Ela ficará visível aos clientes após a
                liberação da plataforma.
              </p>
            )}
            <section className="store-hero" aria-labelledby="store-name">
              <div className="store-cover">
                <span className="hashtag">#PARTIUCOMER</span>
                <CatalogLogo url={store.logoUrl} name={store.name} />
              </div>
              <div className="store-summary">
                <p className="eyebrow">
                  {categoryLabels[store.category] ||
                    store.category ||
                    "Restaurante"}
                </p>
                <h1 id="store-name">{store.name}</h1>
                <p>{store.description}</p>
                <div className="store-meta">
                  <CatalogStatus
                    receiving={store.receivingOrders}
                    unknown={!!catalog.error}
                  />
                  <span>
                    {store.city}, {store.state}
                  </span>
                  {store.acceptsDelivery && (
                    <span>
                      {store.deliveryTime || "Entrega disponível"}
                      {store.deliveryFeeCents !== null
                        ? ` · ${store.deliveryFeeCents === 0 ? "Entrega grátis" : formatMoney(store.deliveryFeeCents)}`
                        : ""}
                    </span>
                  )}
                  {store.acceptsPickup && <span>Retirada na loja</span>}
                </div>
              </div>
            </section>
            {catalog.error && (
              <CatalogMessage
                title="Não foi possível atualizar a loja"
                action={catalog.reload}
              >
                {catalog.error}
              </CatalogMessage>
            )}
            {!store.receivingOrders && !catalog.data?.preview && (
              <p className="catalog-paused">
                O recebimento de pedidos está pausado. Você pode continuar
                consultando o cardápio.
              </p>
            )}
            <div className="catalog-menu-layout">
              <section aria-labelledby="menu-title">
                <div className="results-heading">
                  <h2 id="menu-title">Cardápio</h2>
                </div>
                <label className="search-field">
                  <span className="sr-only">Buscar produto</span>
                  <input
                    type="search"
                    placeholder="O que você quer comer?"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </label>
                {!!catalog.data?.categories.length && (
                  <div className="categories">
                    <button
                      className="category"
                      aria-pressed={!category}
                      onClick={() => setCategory("")}
                    >
                      Todos
                    </button>
                    {catalog.data.categories.map((item) => (
                      <button
                        className="category"
                        key={item.id}
                        aria-pressed={category === item.id}
                        onClick={() => setCategory(item.id)}
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                )}
                <div className="catalog-products">
                  {products.map((product) => (
                    <article className="catalog-product" key={product.id}>
                      {product.imageUrl && (
                        <img
                          className="catalog-product-image"
                          src={product.imageUrl}
                          alt={product.name}
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      )}
                      <div className="catalog-product-copy">
                        <h3>{product.name}</h3>
                        <p>{product.description}</p>
                        <strong>{formatMoney(product.priceCents)}</strong>
                      </div>
                    </article>
                  ))}
                </div>
                {!products.length && (
                  <CatalogMessage title="Nenhum produto encontrado">
                    {search || category
                      ? "Tente outra busca ou categoria."
                      : "Os produtos disponíveis aparecerão aqui quando forem cadastrados."}
                  </CatalogMessage>
                )}
                {catalog.data?.nextProductCursor && (
                  <div className="catalog-load-more">
                    <button
                      className="catalog-button"
                      type="button"
                      onClick={catalog.loadMore}
                      disabled={catalog.loadingMore}
                    >
                      {catalog.loadingMore
                        ? "Carregando…"
                        : "Ver mais produtos"}
                    </button>
                  </div>
                )}
              </section>
              <aside className="about-store catalog-about">
                <h2>Sobre a loja</h2>
                <dl>
                  <div>
                    <dt>Endereço</dt>
                    <dd>
                      {[store.street, store.number].filter(Boolean).join(", ")}
                      <br />
                      {[store.district, `${store.city}, ${store.state}`]
                        .filter(Boolean)
                        .join(" · ")}
                    </dd>
                  </div>
                  <div>
                    <dt>Horários</dt>
                    <dd>
                      {store.openingDay && store.closingDay
                        ? `${store.openingDay}${store.openingDay !== store.closingDay ? ` a ${store.closingDay}` : ""}`
                        : "Horários não informados"}
                      {store.openingTime && store.closingTime && (
                        <>
                          <br />
                          {store.openingTime} às {store.closingTime}
                        </>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Atendimento</dt>
                    <dd>
                      {[
                        store.acceptsDelivery ? "Entrega" : null,
                        store.acceptsPickup ? "Retirada na loja" : null,
                      ]
                        .filter(Boolean)
                        .join(" e ") || "Modalidades não informadas"}
                    </dd>
                  </div>
                </dl>
              </aside>
            </div>
          </>
        )}
      </main>
      <CatalogFooter />
    </div>
  );
}
