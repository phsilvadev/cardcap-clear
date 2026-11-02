"use client";
import { useEffect, useState } from "react";
import { CatalogHeader, CatalogMessage, CatalogFooter } from "./catalog-shared";
import { getPublicProduct, checkoutError } from "@/lib/checkout/service";
import { addToCart } from "@/lib/checkout/cart";
import { priceLine } from "@/firebase/employee-access/product-price.cjs";
import { formatMoney } from "@/lib/storefront/types";
import type { ProductResult, SelectionItem } from "@/lib/checkout/types";
export default function ProductContent({
  storeSlug,
  productId,
  preview,
}: {
  storeSlug: string;
  productId: string;
  preview: boolean;
}) {
  const [data, setData] = useState<ProductResult | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [quantity, setQuantity] = useState(1),
    [choices, setChoices] = useState<Record<number, Record<number, number>>>(
      {},
    ),
    [parts, setParts] = useState<number[]>([]),
    [message, setMessage] = useState("");
  const slug = storeSlug;
  useEffect(() => {
    const store = storeSlug,
      product = productId;
    let active = true;
    setLoading(true);
    setData(null);
    setChoices({});
    setParts([]);
    setQuantity(1);
    setError("");
    if (!store || !product) {
      setLoading(false);
      return;
    }
    getPublicProduct(store, product, preview)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((reason) => {
        if (active) setError(checkoutError(reason));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [storeSlug, productId, preview]);
  const config = data?.product.customization;
  const selection: SelectionItem = {
    productId: data?.product.id ?? "",
    quantity,
    parts,
    groups: Object.entries(choices)
      .map(([groupIndex, values]) => ({
        groupIndex: Number(groupIndex),
        options: Object.entries(values)
          .filter(([, value]) => value > 0)
          .map(([optionIndex, count]) => ({
            optionIndex: Number(optionIndex),
            quantity: count,
          })),
      }))
      .filter((group) => group.options.length),
  };
  let line: ReturnType<typeof priceLine> | undefined,
    validation = "";
  if (data)
    try {
      line = priceLine(
        { ...data.product, available: true, categoryId: "public" },
        selection,
        (_code, text) => {
          throw new Error(text);
        },
      );
    } catch (reason) {
      validation = (reason as Error).message;
    }
  function add() {
    if (!data || !line) return;
    try {
      addToCart(slug, {
        ...selection,
        name: data.product.name,
        priceCents: line.unitCents,
        details: line.details,
      });
      setMessage("Produto adicionado ao carrinho.");
    } catch (reason) {
      setMessage((reason as Error).message);
    }
  }
  return (
    <div className="flow-shell">
      <CatalogHeader
        backHref={
          slug ? `/loja?store=${encodeURIComponent(slug)}` : "/restaurantes"
        }
        backLabel="Voltar à loja"
      />
      <main id="conteudo">
        <h1>Detalhe do produto</h1>
        {loading ? (
          <p role="status">Carregando produto…</p>
        ) : error ? (
          <CatalogMessage title="Produto indisponível">{error}</CatalogMessage>
        ) : !data ? (
          <CatalogMessage title="Selecione um produto">
            Escolha um produto no cardápio de uma loja.
          </CatalogMessage>
        ) : (
          <section className="live-product">
            {data.product.imageUrl && (
              <img
                src={data.product.imageUrl}
                alt={data.product.name}
                className="live-product-image"
              />
            )}
            <div>
              <p className="eyebrow">{data.store.name}</p>
              <h2>{data.product.name}</h2>
              <p>{data.product.description}</p>
              <strong>{formatMoney(data.product.priceCents)}</strong>
              {config?.groups.map((group, index) => (
                <fieldset key={index}>
                  <legend>
                    {group.name} · escolha de {group.min} a {group.max}
                  </legend>
                  {group.options.map((option, optionIndex) => (
                    <label className="commerce-option" key={optionIndex}>
                      <span>
                        {option.name} · {formatMoney(option.priceCents)}
                      </span>
                      <input
                        aria-label={`${group.name}: ${option.name}`}
                        type={group.repeat ? "number" : "checkbox"}
                        min={0}
                        max={20}
                        checked={
                          !group.repeat
                            ? !!choices[index]?.[optionIndex]
                            : undefined
                        }
                        value={
                          group.repeat
                            ? (choices[index]?.[optionIndex] ?? 0)
                            : undefined
                        }
                        onChange={(event) =>
                          setChoices((current) => ({
                            ...current,
                            [index]: {
                              ...current[index],
                              [optionIndex]: group.repeat
                                ? Math.min(
                                    20,
                                    Math.max(0, Number(event.target.value)),
                                  )
                                : Number(event.target.checked),
                            },
                          }))
                        }
                      />
                    </label>
                  ))}
                </fieldset>
              ))}
              {config?.division && (
                <fieldset>
                  <legend>
                    Dividir em até {config.division.maxParts} partes
                  </legend>
                  {config.division.options.map((option, index) => (
                    <label className="commerce-option" key={index}>
                      <span>
                        {option.name}
                        {config.division?.pricing !== "fixed"
                          ? ` · ${formatMoney(option.priceCents)}`
                          : ""}
                      </span>
                      <input
                        type="checkbox"
                        checked={parts.includes(index)}
                        onChange={(event) =>
                          setParts((current) =>
                            event.target.checked
                              ? [...current, index]
                              : current.filter((part) => part !== index),
                          )
                        }
                      />
                    </label>
                  ))}
                </fieldset>
              )}
              <label className="commerce-option">
                Quantidade
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(
                      Math.min(99, Math.max(1, Number(event.target.value))),
                    )
                  }
                />
              </label>
              {validation && <p role="status">{validation}</p>}
              {line && (
                <p>
                  Total: <strong>{formatMoney(line.totalCents)}</strong>
                </p>
              )}
              <button
                className="flow-button"
                disabled={!line || data.preview || !data.store.receivingOrders}
                onClick={add}
              >
                Adicionar ao carrinho
              </button>
              {(data.preview || !data.store.receivingOrders) && (
                <p>A loja não está recebendo pedidos neste momento.</p>
              )}
              <p role="status">{message}</p>
              <a
                className="flow-button secondary"
                href={`/carrinho?store=${encodeURIComponent(slug)}`}
              >
                Ver carrinho
              </a>
            </div>
          </section>
        )}
      </main>
      <CatalogFooter />
    </div>
  );
}
