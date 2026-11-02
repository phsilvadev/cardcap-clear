"use client";
import { useEffect, useState } from "react";
import type { CartEntry } from "./types";
const cartKey = (slug: string) => `cardap-cart:v1:${slug}`;
export function readCart(slug: string): CartEntry[] {
  const value = JSON.parse(
    localStorage.getItem(cartKey(slug)) ?? "[]",
  ) as CartEntry[];
  if (!Array.isArray(value) || value.length > 20) return [];
  return value.filter(
    (item) =>
      item &&
      typeof item.key === "string" &&
      typeof item.productId === "string" &&
      typeof item.name === "string" &&
      Number.isInteger(item.quantity) &&
      item.quantity > 0 &&
      item.quantity <= 99 &&
      Number.isSafeInteger(item.priceCents) &&
      item.priceCents >= 0 &&
      Array.isArray(item.details),
  );
}
export function saveCart(slug: string, items: CartEntry[]) {
  localStorage.setItem(cartKey(slug), JSON.stringify(items));
  window.dispatchEvent(new Event("cardap:cart"));
}
export function addToCart(slug: string, item: Omit<CartEntry, "key">) {
  const items = readCart(slug);
  const key = JSON.stringify([
    item.productId,
    item.groups ?? [],
    item.parts ?? [],
  ]);
  const existing = items.find((entry) => entry.key === key);
  if (existing) {
    if (existing.quantity + item.quantity > 99)
      throw new Error("O limite por item é de 99 unidades.");
    existing.quantity += item.quantity;
    existing.priceCents = item.priceCents;
  } else {
    if (items.length >= 20)
      throw new Error("O limite é de 20 itens diferentes por pedido.");
    items.push({ ...item, key });
  }
  saveCart(slug, items);
}
export function useStoreCart(slug: string) {
  const [items, setItems] = useState<CartEntry[]>([]),
    [loaded, setLoaded] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    setLoaded(false);
    setItems([]);
    if (!slug) return;
    const read = () => {
      try {
        setItems(readCart(slug));
        setError("");
      } catch {
        setError("Não foi possível ler o carrinho neste navegador.");
      }
      setLoaded(true);
    };
    read();
    window.addEventListener("storage", read);
    window.addEventListener("cardap:cart", read);
    return () => {
      window.removeEventListener("storage", read);
      window.removeEventListener("cardap:cart", read);
    };
  }, [slug]);
  function update(next: CartEntry[]) {
    try {
      saveCart(slug, next);
      setItems(next);
    } catch {
      setError("Não foi possível salvar o carrinho neste navegador.");
    }
  }
  return { items, loaded, error, update };
}
export const cartSelections = (items: CartEntry[]) =>
  items.map(({ productId, quantity, groups, parts }) => ({
    productId,
    quantity,
    groups: groups ?? [],
    parts: parts ?? [],
  }));
