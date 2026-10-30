"use client";
import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import {
  getPublicStore,
  getPublicStoreSummary,
  isStoreUnavailable,
} from "@/lib/storefront/service";
import type { StorefrontResult } from "@/lib/storefront/types";
export function usePublicStore(slug: string, preview: boolean) {
  const [data, setData] = useState<StorefrontResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const version = useRef(0);
  const pending = useRef(false);
  useEffect(() => {
    const current = ++version.current;
    let loaded = false;
    let summaryPending = false;
    let authEpoch = 0;
    setData(null);
    setError("");
    setLoading(true);
    setLoadingMore(false);
    pending.current = false;
    if (!slug) {
      setLoading(false);
      return;
    }
    const fail = (reason: unknown) => {
      if (current !== version.current) return;
      if (isStoreUnavailable(reason)) {
        setData(null);
        loaded = false;
      }
      setError(
        isStoreUnavailable(reason)
          ? "Esta loja não está disponível na plataforma."
          : "Não foi possível atualizar a loja. Confira sua conexão e tente novamente.",
      );
    };
    const load = () => {
      const epoch = ++authEpoch;
      getPublicStore(slug, preview)
        .then((result) => {
          if (current === version.current && epoch === authEpoch) {
            setData(result);
            setError("");
            loaded = true;
          }
        })
        .catch((reason) => {
          if (epoch === authEpoch) fail(reason);
        })
        .finally(() => {
          if (current === version.current && epoch === authEpoch)
            setLoading(false);
        });
    };
    const stopAuth = preview
      ? onAuthStateChanged(getFirebaseAuth(), () => {
          if (current !== version.current) return;
          setData(null);
          loaded = false;
          setLoading(true);
          load();
        })
      : () => {};
    if (!preview) load();
    async function refresh() {
      if (document.hidden || !loaded || summaryPending) return;
      summaryPending = true;
      const epoch = authEpoch;
      try {
        const result = await getPublicStoreSummary(slug, preview);
        if (current === version.current && epoch === authEpoch) {
          setData((value) => (value ? { ...value, ...result } : value));
          setError("");
        }
      } catch (reason) {
        if (epoch === authEpoch) fail(reason);
      } finally {
        summaryPending = false;
      }
    }
    const interval = window.setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      version.current++;
      stopAuth();
      clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [slug, preview, retry]);
  async function loadMore() {
    if (!data?.nextProductCursor || pending.current) return;
    const current = version.current;
    const uid = getFirebaseAuth().currentUser?.uid;
    pending.current = true;
    setLoadingMore(true);
    setError("");
    try {
      const result = await getPublicStore(
        slug,
        preview,
        data.nextProductCursor,
      );
      if (
        current !== version.current ||
        (preview && uid !== getFirebaseAuth().currentUser?.uid)
      )
        return;
      setData((value) =>
        value
          ? {
              ...result,
              products: [
                ...value.products,
                ...result.products.filter(
                  (item) =>
                    !value.products.some((product) => product.id === item.id),
                ),
              ],
            }
          : value,
      );
    } catch (reason) {
      if (current === version.current) {
        if (isStoreUnavailable(reason)) setData(null);
        setError("Não foi possível carregar mais produtos. Tente novamente.");
      }
    } finally {
      if (current === version.current) {
        pending.current = false;
        setLoadingMore(false);
      }
    }
  }
  return {
    data,
    loading,
    loadingMore,
    error,
    loadMore,
    reload: () => setRetry((value) => value + 1),
  };
}
