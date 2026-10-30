"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  collection,
  query,
  limit,
  where,
  onSnapshot,
} from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase/client";
import { getStoreReadiness } from "@/lib/onboarding/service";
export function useStoreReadiness(storeId?: string) {
  const [data, setData] = useState<Awaited<
    ReturnType<typeof getStoreReadiness>
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const request = useRef(0);
  useEffect(() => {
    if (!open) return;
    const body = document.body;
    const root = document.documentElement;
    const bodyOverflow = body.style.overflow;
    const rootOverflow = root.style.overflow;
    body.style.overflow = "hidden";
    root.style.overflow = "hidden";
    return () => {
      body.style.overflow = bodyOverflow;
      root.style.overflow = rootOverflow;
    };
  }, [open]);
  const refresh = useCallback(async () => {
    if (!storeId) return;
    const current = ++request.current;
    setLoading(true);
    setError("");
    try {
      const result = await getStoreReadiness(storeId);
      if (current === request.current) setData(result);
    } catch {
      if (current === request.current)
        setError(
          "Não foi possível conferir o cadastro da loja. Verifique sua conexão e tente novamente.",
        );
    } finally {
      if (current === request.current) setLoading(false);
    }
  }, [storeId]);
  useEffect(() => {
    setData(null);
    void refresh();
    return () => {
      request.current++;
    };
  }, [refresh]);
  useEffect(() => {
    const update = () => {
      void refresh();
    };
    window.addEventListener("cardap:store-updated", update);
    window.addEventListener("focus", update);
    return () => {
      window.removeEventListener("cardap:store-updated", update);
      window.removeEventListener("focus", update);
    };
  }, [refresh]);
  useEffect(() => {
    if (!storeId) return;
    let stopped = false;
    const unsubscribers: (() => void)[] = [];
    let timer: ReturnType<typeof setTimeout>;
    const changed = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (!stopped) void refresh();
      }, 150);
    };
    void getFirebaseAuth()
      .authStateReady()
      .then(() => {
        if (stopped || getFirebaseAuth().currentUser?.uid !== storeId) return;
        const db = getFirebaseDb();
        for (const source of [
          query(collection(db, "tenants", storeId, "categories"), limit(1)),
          query(
            collection(db, "tenants", storeId, "products"),
            where("available", "==", true),
            limit(1),
          ),
        ]) {
          unsubscribers.push(onSnapshot(source, changed, () => {}));
        }
      })
      .catch(() => {});
    return () => {
      stopped = true;
      clearTimeout(timer);
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [storeId, refresh]);
  const awaitingActivation = Boolean(
    data &&
    data.items.every((item) => item.complete || item.id === "activation") &&
    data.items.some((item) => item.id === "activation" && !item.complete),
  );
  return {
    awaitingActivation,
    data,
    loading,
    error,
    open,
    refresh,
    show: () => {
      setOpen(true);
      void refresh();
    },
    close: () => setOpen(false),
  };
}
