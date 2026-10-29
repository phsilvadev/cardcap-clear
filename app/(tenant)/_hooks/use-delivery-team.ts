"use client";
import { useEffect, useMemo, useState } from "react";
import { getDemoOrderStore } from "@/lib/orders/demo-store";
import { employeeCouriers } from "@/lib/employees/couriers";
import {
  employeeError,
  getEmployeeOwner,
  watchCourierEmployees,
} from "@/lib/employees/service";
export function useDeliveryTeam(tenantSlug: string, storeId?: string) {
  const store = useMemo(() => getDemoOrderStore(tenantSlug), [tenantSlug]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    let unsubscribe = () => {};
    store.hydrate();
    store.beginCourierSync();
    setReady(false);
    setError("");
    const fail = (cause: unknown) => {
      if (cancelled) return;
      store.syncCourierTeam([]);
      store.beginCourierSync();
      setReady(false);
      setError(employeeError(cause));
    };
    if (!storeId) fail(new Error("Não foi possível identificar a loja."));
    else
      void getEmployeeOwner(storeId)
        .then(() => {
          if (cancelled) return;
          unsubscribe = watchCourierEmployees(
            storeId,
            (employees) => {
              if (cancelled) return;
              store.syncCourierTeam(
                employeeCouriers(employees, store.getSnapshot().couriers),
              );
              setReady(true);
              setError("");
            },
            fail,
            () => {
              if (!cancelled) {
                store.beginCourierSync();
                setReady(false);
              }
            },
          );
        })
        .catch(fail);
    return () => {
      cancelled = true;
      unsubscribe();
      store.beginCourierSync();
    };
  }, [store, storeId, attempt]);
  return { store, ready, error, retry: () => setAttempt((value) => value + 1) };
}
