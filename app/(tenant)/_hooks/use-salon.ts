"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import {
  salonOperation,
  salonError,
  uncertainSalonError,
} from "@/lib/salon/service";
import type { SalonState } from "@/lib/salon/types";
type Pending = {
  action: string;
  fields: Record<string, unknown>;
  requestId: string;
};
export function useSalon(storeId?: string) {
  const [data, setData] = useState<SalonState | null>(null),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [pending, setPending] = useState<Pending | null>(null);
  const scope = useRef(0),
    reads = useRef(0),
    inflight = useRef(false),
    pendingRef = useRef<Pending | null>(null);
  const refresh = useCallback(async () => {
    const uid = getFirebaseAuth().currentUser?.uid;
    if (!uid) return;
    const version = scope.current,
      sequence = ++reads.current;
    try {
      const result = await salonOperation<SalonState>(
        "list",
        storeId ? { storeId } : {},
      );
      if (
        version !== scope.current ||
        sequence !== reads.current ||
        uid !== getFirebaseAuth().currentUser?.uid
      )
        return;
      setData(result);
    } catch (reason) {
      if (version === scope.current) setError(salonError(reason));
    } finally {
      if (version === scope.current) setLoading(false);
    }
  }, [storeId]);
  useEffect(() => {
    const stop = onAuthStateChanged(getFirebaseAuth(), (user) => {
      scope.current++;
      reads.current++;
      setData(null);
      setError("");
      setLoading(!!user);
      pendingRef.current = null;
      setPending(null);
      inflight.current = false;
      setBusy(false);
      if (!user) {
        setLoading(false);
        return;
      }
      if (storeId && user.uid !== storeId) {
        setError("Entre com a conta do proprietário deste restaurante.");
        setLoading(false);
        return;
      }
      try {
        const cached = sessionStorage.getItem(
          `cardap-salon-pending:${user.uid}`,
        );
        if (cached) {
          const value = JSON.parse(cached) as Pending;
          if (
            value &&
            typeof value.action === "string" &&
            typeof value.requestId === "string" &&
            value.fields &&
            typeof value.fields === "object"
          ) {
            pendingRef.current = value;
            setPending(value);
          }
        }
      } catch {
        setError(
          "Não foi possível recuperar o último envio. Confira a conta antes de continuar.",
        );
      }
      void refresh();
    });
    const update = () => {
      if (!document.hidden && !inflight.current) void refresh();
    };
    const interval = window.setInterval(update, 5000);
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      scope.current++;
      reads.current++;
      stop();
      clearInterval(interval);
      window.removeEventListener("focus", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [refresh, storeId]);
  async function send(operation: Pending) {
    const uid = getFirebaseAuth().currentUser?.uid;
    if (!uid || inflight.current) return false;
    const version = scope.current,
      key = `cardap-salon-pending:${uid}`;
    inflight.current = true;
    reads.current++;
    setBusy(true);
    setError("");
    try {
      sessionStorage.setItem(key, JSON.stringify(operation));
    } catch {
      inflight.current = false;
      setBusy(false);
      setError(
        "Não foi possível preparar o envio com segurança. Confira o armazenamento do navegador.",
      );
      return false;
    }
    pendingRef.current = operation;
    setPending(operation);
    try {
      await salonOperation(operation.action, {
        ...operation.fields,
        ...(storeId ? { storeId } : {}),
        requestId: operation.requestId,
      });
      sessionStorage.removeItem(key);
      if (
        version !== scope.current ||
        getFirebaseAuth().currentUser?.uid !== uid
      )
        return false;
      pendingRef.current = null;
      setPending(null);
      await refresh();
      return true;
    } catch (reason) {
      if (version === scope.current) {
        setError(salonError(reason));
        if (!uncertainSalonError(reason)) {
          try {
            sessionStorage.removeItem(key);
          } catch {}
          pendingRef.current = null;
          setPending(null);
        }
      }
      return false;
    } finally {
      if (version === scope.current) {
        inflight.current = false;
        setBusy(false);
      }
    }
  }
  async function mutate(action: string, fields: Record<string, unknown> = {}) {
    if (inflight.current || pendingRef.current) return false;
    return send({ action, fields, requestId: crypto.randomUUID() });
  }
  return {
    data,
    loading,
    busy,
    error,
    pending,
    refresh,
    mutate,
    retryPending: () =>
      pendingRef.current ? send(pendingRef.current) : Promise.resolve(false),
  };
}
