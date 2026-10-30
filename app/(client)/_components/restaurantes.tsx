"use client";
import { useState } from "react";
import { usePublicStores } from "../_hooks/use-public-stores";
import {
  categoryLabels,
  normalizeSearch,
  formatMoney,
} from "@/lib/storefront/types";
import {
  CatalogHeader,
  CatalogLogo,
  CatalogStatus,
  CatalogSkeleton,
  CatalogMessage,
  CatalogFooter,
} from "./catalog-shared";
export default function RestaurantesContent({
  city,
  state,
}: {
  city: string;
  state: string;
}) {
  const catalog = usePublicStores(city, state);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const categories = [
    ...new Set(catalog.stores.map((store) => store.category)),
  ].filter(Boolean);
  const stores = catalog.stores.filter(
    (store) =>
      (!category || store.category === category) &&
      normalizeSearch(`${store.name} ${store.description}`).includes(
        normalizeSearch(search),
      ),
  );
  return (
    <div className="shell public-catalog">
      <CatalogHeader />
      <main id="conteudo">
        <section className="intro" aria-labelledby="page-title">
          <p className="eyebrow">Sua cidade. Seus sabores.</p>
          <h1 id="page-title">
            Sua próxima refeição
            <br />
            está <span className="text-brand">por aqui.</span>
          </h1>
          <p className="text-muted">
            Descubra os restaurantes da sua região e conheça seus cardápios.
          </p>
          <div className="intro-bottom">
            <span className="region-pill">
              {catalog.hasRegion ? `${city}, ${state}` : "Escolha sua região"}
            </span>
            <button
              className="catalog-text-button"
              type="button"
              onClick={catalog.reload}
              disabled={catalog.loading || !catalog.hasRegion}
            >
              Atualizar lojas
            </button>
          </div>
        </section>
        {catalog.hasRegion && (
          <section className="filters" aria-label="Buscar restaurantes">
            <label className="search-field">
              <span className="sr-only">Buscar restaurante</span>
              <input
                type="search"
                placeholder="Qual restaurante você procura?"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            {categories.length > 0 && (
              <div className="categories">
                <button
                  className="category"
                  aria-pressed={!category}
                  onClick={() => setCategory("")}
                >
                  Todos
                </button>
                {categories.map((value) => (
                  <button
                    key={value}
                    className="category"
                    aria-pressed={category === value}
                    onClick={() => setCategory(value)}
                  >
                    {categoryLabels[value] || value}
                  </button>
                ))}
              </div>
            )}
          </section>
        )}
        <section aria-labelledby="results-title">
          <div className="results-heading">
            <h2 id="results-title">Restaurantes por perto</h2>
            {!catalog.loading && catalog.hasRegion && (
              <span className="text-muted">
                {stores.length}{" "}
                {stores.length === 1 ? "restaurante" : "restaurantes"}
              </span>
            )}
          </div>
          {catalog.loading ? (
            <CatalogSkeleton />
          ) : !catalog.hasRegion ? (
            <CatalogMessage title="Onde bateu a fome?">
              <a href="/#buscar">
                Escolha sua cidade e estado para encontrar restaurantes.
              </a>
            </CatalogMessage>
          ) : (
            <>
              {catalog.error && (
                <CatalogMessage
                  title="Não foi possível atualizar as lojas"
                  action={catalog.reload}
                >
                  {catalog.error}
                </CatalogMessage>
              )}
              <div className="restaurants">
                {stores.map((store) => (
                  <a
                    className="restaurant catalog-restaurant"
                    key={store.slug}
                    href={`/loja?${new URLSearchParams({ store: store.slug, city, state })}`}
                  >
                    <div className="restaurant-art">
                      <CatalogLogo url={store.logoUrl} name={store.name} />
                    </div>
                    <div className="restaurant-copy">
                      <CatalogStatus receiving={store.receivingOrders} />
                      <h3>{store.name}</h3>
                      <p className="catalog-category">
                        {categoryLabels[store.category] || store.category}
                      </p>
                      <p className="catalog-card-description">
                        {store.description}
                      </p>
                      <div className="card-bottom">
                        <span>
                          {store.city}, {store.state}
                        </span>
                        <span>
                          {store.acceptsDelivery &&
                          store.deliveryFeeCents !== null
                            ? store.deliveryFeeCents === 0
                              ? "Entrega grátis"
                              : `Entrega ${formatMoney(store.deliveryFeeCents)}`
                            : store.acceptsPickup
                              ? "Retirada na loja"
                              : "Ver cardápio"}
                        </span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
              {!stores.length && !catalog.error && (
                <CatalogMessage
                  title={
                    search || category
                      ? "Nenhum restaurante encontrado"
                      : "Ainda não encontramos lojas nesta região"
                  }
                >
                  {search || category
                    ? "Tente outro nome ou outra categoria."
                    : catalog.nextCursor
                      ? "Continue a busca para consultar mais restaurantes."
                      : "Novos restaurantes aparecerão aqui quando forem liberados na plataforma."}
                </CatalogMessage>
              )}
              {catalog.nextCursor && (
                <div className="catalog-load-more">
                  <button
                    type="button"
                    className="catalog-button"
                    onClick={catalog.loadMore}
                    disabled={catalog.loadingMore}
                  >
                    {catalog.loadingMore
                      ? "Buscando…"
                      : "Buscar mais restaurantes"}
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>
      <CatalogFooter />
    </div>
  );
}
