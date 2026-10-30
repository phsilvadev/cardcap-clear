"use client";
import { useEffect, useRef, useState } from "react";
import { listPublicStores } from "@/lib/storefront/service";
import type { PublicStore } from "@/lib/storefront/types";
export function usePublicStores(city: string, state: string) {
  const [stores, setStores] = useState<PublicStore[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const generation = useRef(0);
  const pending = useRef(false);
  const pages = useRef(1);
  const hasRegion = city.trim().length >= 2 && /^[A-Z]{2}$/.test(state);
  useEffect(() => {
    const version = ++generation.current;
    let loaded = false;
    pages.current = 1;
    pending.current = false;
    setStores([]);
    setNextCursor(null);
    setError("");
    setLoadingMore(false);
    if (!hasRegion) {
      setLoading(false);
      return;
    }
    setLoading(true);
    listPublicStores(city, state)
      .then((result) => {
        if (version !== generation.current) return;
        setStores(result.stores);
        setNextCursor(result.nextCursor);
        loaded = true;
      })
      .catch(() => {
        if (version === generation.current)
          setError(
            "Não foi possível carregar as lojas. Confira sua conexão e tente novamente.",
          );
      })
      .finally(() => {
        if (version === generation.current) setLoading(false);
      });
    async function refresh() {
      if (document.hidden || !loaded || pending.current) return;
      pending.current = true;
      try {
        const updated = new Map<string, PublicStore>();
        let cursor: string | undefined;
        let next: string | null = null;
        for (let page = 0; page < pages.current; page++) {
          const result = await listPublicStores(city, state, cursor);
          if (version !== generation.current) return;
          result.stores.forEach((store) => updated.set(store.slug, store));
          next = result.nextCursor;
          if (!next) break;
          cursor = next;
        }
        setStores([...updated.values()]);
        setNextCursor(next);
        setError("");
      } catch {
        if (version === generation.current)
          setError("Não foi possível atualizar as lojas. Tente novamente.");
      } finally {
        if (version === generation.current) pending.current = false;
      }
    }
    const interval = window.setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      generation.current++;
      clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [city, state, retry, hasRegion]);
  async function loadMore() {
    if (!nextCursor || pending.current || loading) return;
    const version = generation.current;
    pending.current = true;
    setLoadingMore(true);
    setError("");
    try {
      const result = await listPublicStores(city, state, nextCursor);
      if (version !== generation.current) return;
      setStores((current) => [
        ...current,
        ...result.stores.filter(
          (item) => !current.some((store) => store.slug === item.slug),
        ),
      ]);
      setNextCursor(result.nextCursor);
      pages.current++;
    } catch {
      if (version === generation.current)
        setError("Não foi possível carregar mais lojas. Tente novamente.");
    } finally {
      if (version === generation.current) {
        pending.current = false;
        setLoadingMore(false);
      }
    }
  }
  return {
    stores,
    loading,
    loadingMore,
    error,
    hasRegion,
    nextCursor,
    loadMore,
    reload: () => setRetry((value) => value + 1),
  };
}
