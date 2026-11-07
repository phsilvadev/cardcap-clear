"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { getCustomerAuth } from "@/lib/firebase/client";
import { customerError, loadCustomer } from "./service";
import type { CustomerProfile } from "./types";
export function useCustomer() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [ready, setReady] = useState(false),
    [error, setError] = useState("");
  const version = useRef(0);
  const refresh = useCallback(async () => {
    const current = getCustomerAuth().currentUser;
    const request = ++version.current;
    if (!current) return;
    try {
      const result = await loadCustomer();
      if (
        request === version.current &&
        getCustomerAuth().currentUser?.uid === current.uid
      ) {
        setProfile(result);
        setError("");
      }
    } catch (reason) {
      if (request === version.current) setError(customerError(reason));
    }
  }, []);
  useEffect(() => {
    let stop = () => {};
    try {
      stop = onAuthStateChanged(getCustomerAuth(), (next) => {
        version.current++;
        setUser(next);
        setProfile(null);
        setError("");
        setReady(true);
        if (next) void refresh();
      });
    } catch (reason) {
      setError(customerError(reason));
      setReady(true);
    }
    return () => {
      version.current++;
      stop();
    };
  }, [refresh]);
  return { user, profile, setProfile, ready, error, refresh };
}
