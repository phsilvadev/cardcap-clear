"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { getStoreReadiness } from "@/lib/onboarding/service";
export function useStoreReadiness(storeId?: string) {
  const [data, setData] = useState<Awaited<
    ReturnType<typeof getStoreReadiness>
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const request = useRef(0);
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
    show: () => setOpen(true),
    close: () => setOpen(false),
  };
}
