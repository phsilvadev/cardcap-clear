"use client";
import { useEffect, useState, useRef } from "react";
import type { QueryDocumentSnapshot } from "firebase/firestore";
import type { MenuProduct } from "@/lib/menu/types";
import type { MenuCategory } from "@/lib/menu/category-types";
import {
  getMenuOwner,
  listProducts,
  listCategories,
  setProductAvailability,
  removeProduct,
  menuError,
} from "@/lib/menu/service";
import { formatProductPrice } from "@/lib/menu/product-validation";
import { useProductImage } from "@/app/(tenant)/_hooks/use-product-image";
import ProductDialog from "./product-dialog";
import CategoryCreate from "./category-create";
import ProductCardSkeleton from "./product-card-skeleton";

function ProductPhoto({ product }: { product: MenuProduct }) {
  const image = useProductImage(product.imagePath);
  const [loadedUrl, setLoadedUrl] = useState<string>();
  const loading =
    image.loading || Boolean(image.url && loadedUrl !== image.url);
  return (
    <div className="menu-product-visual" aria-busy={loading}>
      {loading && <span className="menu-image-skeleton" aria-hidden="true" />}
      {image.url ? (
        <img
          src={image.url}
          className={`menu-product-photo${loading ? " is-loading" : ""}`}
          alt={product.name}
          onLoad={() => setLoadedUrl(image.url)}
          onError={image.onError}
        />
      ) : !loading ? (
        <span className="menu-product-placeholder" aria-hidden="true">
          Sem foto
        </span>
      ) : null}
    </div>
  );
}
export default function ProductList({ storeId }: { storeId: string }) {
  const [products, setProducts] = useState<MenuProduct[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [moreLoading, setMoreLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const cursor = useRef<QueryDocumentSnapshot | undefined>(undefined);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<MenuProduct | null>(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    Promise.all([
      getMenuOwner(storeId),
      listProducts(storeId),
      listCategories(storeId),
    ])
      .then(([owner, page, items]) => {
        if (!active) return;
        setCanManage(owner.canManage);
        setProducts(page.products);
        cursor.current = page.cursor;
        setHasMore(page.hasMore);
        setCategories(items);
        const saved = new URLSearchParams(window.location.search).get("salvo");
        if (saved === "criado" || saved === "editado")
          setNotice(
            saved === "criado" ? "Produto cadastrado." : "Produto atualizado.",
          );
      })
      .catch((cause) => {
        if (active) setError(menuError(cause));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [storeId, retry]);
  async function loadMore() {
    if (moreLoading) return;
    setMoreLoading(true);
    setError("");
    try {
      const page = await listProducts(storeId, cursor.current);
      setProducts((items) => [
        ...items,
        ...page.products.filter(
          (item) => !items.some((current) => current.id === item.id),
        ),
      ]);
      cursor.current = page.cursor;
      setHasMore(page.hasMore);
    } catch (cause) {
      setError(menuError(cause));
    } finally {
      setMoreLoading(false);
    }
  }
  async function toggle(product: MenuProduct) {
    if (busy) return;
    setBusy(product.id);
    setError("");
    setNotice("");
    try {
      await setProductAvailability(storeId, product.id, !product.available);
      setProducts((items) =>
        items.map((item) =>
          item.id === product.id
            ? { ...item, available: !item.available }
            : item,
        ),
      );
      setNotice(
        `${product.name}: ${product.available ? "pausado" : "disponível"}.`,
      );
    } catch (cause) {
      setError(menuError(cause));
    } finally {
      setBusy(null);
    }
  }
  async function confirmDelete() {
    if (!deleting || busy) return;
    setBusy(deleting.id);
    setError("");
    setNotice("");
    try {
      const message = await removeProduct(storeId, deleting.id);
      setProducts((items) => items.filter((item) => item.id !== deleting.id));
      setDeleting(null);
      setNotice(message);
    } catch (cause) {
      setError(menuError(cause));
    } finally {
      setBusy(null);
    }
  }
  const visible = products.filter(
    (product) =>
      (!category || product.categoryId === category) &&
      product.name
        .toLocaleLowerCase("pt-BR")
        .includes(search.trim().toLocaleLowerCase("pt-BR")),
  );
  return (
    <>
      <div className="menu-page-actions">
        {canManage ? (
          <a className="button primary" href="/dashboard/cardapio/novo">
            Cadastrar produto <span aria-hidden="true">+</span>
          </a>
        ) : (
          <button className="button primary" disabled>
            Cadastrar produto <span aria-hidden="true">+</span>
          </button>
        )}

        <CategoryCreate
          storeId={storeId}
          disabled={loading || !canManage}
          onCreated={(item) =>
            setCategories((items) =>
              [...items, item].sort((a, b) =>
                a.name.localeCompare(b.name, "pt-BR"),
              ),
            )
          }
        />
      </div>
      {!loading && !error && !canManage && (
        <p className="menu-notice">
          Conclua os dados da loja e informe a carteira de recebimento no Anow
          para cadastrar ou alterar produtos.
        </p>
      )}
      <section className="panel" aria-label="Produtos do restaurante">
        <div className="menu-filters">
          <label>
            Buscar produto
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nome do produto"
            />
          </label>
          <label>
            Categoria
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="">Todas as categorias</option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p role="status" className={loading ? "sr-only" : "menu-status"}>
          {loading ? "Carregando produtos…" : notice}
        </p>
        {error && (
          <div role="alert">
            <p>{error}</p>
            <button
              className="button secondary"
              onClick={() => setRetry((value) => value + 1)}
            >
              Tentar novamente
            </button>
          </div>
        )}
        {!loading && !error && !products.length && (
          <div className="menu-empty">
            <h2>Seu cardápio começa aqui</h2>
            <p>
              Cadastre o primeiro produto para organizar os sabores da sua loja.
            </p>
            {canManage && (
              <a className="button primary" href="/dashboard/cardapio/novo">
                Cadastrar primeiro produto
              </a>
            )}
          </div>
        )}
        {!loading && products.length > 0 && !visible.length && (
          <p className="menu-empty">
            Nenhum produto encontrado nos itens carregados.
          </p>
        )}
        <div className="menu-product-list" aria-busy={loading || moreLoading}>
          {loading && <ProductCardSkeleton />}
          {(loading ? [] : visible).map((product) => (
            <article className="menu-product-row" key={product.id}>
              <ProductPhoto product={product} />
              <div className="menu-product-copy">
                <h2>{product.name}</h2>
                <p>
                  {categories.find((item) => item.id === product.categoryId)
                    ?.name ?? "Categoria indisponível"}
                </p>
                <strong>{formatProductPrice(product.priceCents)}</strong>
                <span>{product.available ? "Disponível" : "Pausado"}</span>
              </div>
              <div className="menu-product-actions">
                <button
                  className="button secondary"
                  disabled={!canManage || busy !== null}
                  aria-label={`Disponibilidade de ${product.name}`}
                  aria-pressed={product.available}
                  onClick={() => toggle(product)}
                >
                  {busy === product.id
                    ? "Aguarde…"
                    : product.available
                      ? "Pausar"
                      : "Disponibilizar"}
                </button>
                {canManage && (
                  <a
                    className="button secondary"
                    href={`/dashboard/cardapio/${encodeURIComponent(product.id)}/editar`}
                  >
                    Editar<span className="sr-only"> {product.name}</span>
                  </a>
                )}
                <button
                  className="button danger"
                  disabled={!canManage || busy !== null}
                  onClick={() => {
                    setError("");
                    setDeleting(product);
                  }}
                >
                  Excluir<span className="sr-only"> {product.name}</span>
                </button>
              </div>
            </article>
          ))}
          {!loading && moreLoading && <ProductCardSkeleton />}
        </div>
        {!loading && hasMore && (
          <button
            className="button secondary"
            disabled={moreLoading}
            onClick={loadMore}
          >
            {moreLoading ? "Carregando…" : "Carregar mais produtos"}
          </button>
        )}
      </section>
      <ProductDialog
        id="delete-product"
        title="Excluir produto?"
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        preventClose={busy !== null}
      >
        <p>
          O produto “{deleting?.name}” será removido do cardápio. Esta ação não
          pode ser desfeita.
        </p>
        {error && <p role="alert">{error}</p>}
        <div className="dialog-actions">
          <button
            className="button secondary"
            disabled={busy !== null}
            onClick={() => setDeleting(null)}
          >
            Cancelar
          </button>
          <button
            className="button danger"
            disabled={busy !== null}
            onClick={confirmDelete}
          >
            {busy ? "Excluindo…" : "Confirmar exclusão"}
          </button>
        </div>
      </ProductDialog>
    </>
  );
}
