"use client";
import { useEffect, useState } from "react";
import { onIdTokenChanged } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { establishSession, logoutRestaurant } from "@/lib/auth/tenant-client";

export default function TenantSessionControls() {
  const [error, setError] = useState("");
  useEffect(() => {
    const auth = getFirebaseAuth();
    let stopped = false;
    const refresh = async () => {
      if (!auth.currentUser) return;
      try {
        await establishSession(auth.currentUser);
      } catch {
        if (!stopped) window.location.replace("/restaurantes/login");
      }
    };
    const unsubscribe = onIdTokenChanged(auth, () => {
      void refresh();
    });
    const interval = setInterval(
      () => {
        void refresh();
      },
      45 * 60 * 1000,
    );
    return () => {
      stopped = true;
      unsubscribe();
      clearInterval(interval);
    };
  }, []);
  return (
    <div style={{ position: "fixed", right: 24, bottom: 24, zIndex: 100 }}>
      <button
        type="button"
        className="btn"
        onClick={async () => {
          try {
            await logoutRestaurant();
          } catch {
            setError("Não foi possível sair. Tente novamente.");
          }
        }}
      >
        Sair da conta
      </button>
      <p role="status">{error}</p>
    </div>
  );
}
