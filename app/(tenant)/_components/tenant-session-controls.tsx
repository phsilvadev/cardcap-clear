"use client";
import { useEffect, useState } from "react";
import { onIdTokenChanged } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { establishSession, logoutRestaurant } from "@/lib/auth/tenant-client";

export default function TenantSessionControls() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
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
    <div className="sidebar-session">
      <button
        type="button"
        className="sidebar-logout"
        disabled={loading}
        onClick={async () => {
          if (loading) return;
          setLoading(true);
          setError("");
          try {
            await logoutRestaurant();
          } catch {
            setError("Não foi possível sair. Tente novamente.");
            setLoading(false);
          }
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="m16 17 5-5-5-5M21 12H9" />
        </svg>
        {loading ? "Saindo…" : "Sair da conta"}
      </button>
      <p className="sidebar-session-error" role="status">
        {error}
      </p>
    </div>
  );
}
