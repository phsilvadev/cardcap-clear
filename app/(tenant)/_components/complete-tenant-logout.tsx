"use client";
import { useEffect, useRef, useState } from "react";
import { signOut } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
export default function CompleteTenantLogout() {
  const started = useRef(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void (async () => {
      try {
        const response = await fetch("/api/auth/logout-transfer", {
          headers: { "X-Cardap-Logout": "1" },
          cache: "no-store",
        });
        if (!response.ok) throw new Error();
        await signOut(getFirebaseAuth());
        window.location.replace("/restaurantes/login");
      } catch {
        setError(true);
        void window.cardapPrinter?.ready?.().catch(() => {});
      }
    })();
  }, []);
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        textAlign: "center",
      }}
    >
      <div>
        <p role="status">
          {error
            ? "Não foi possível concluir a saída."
            : "Encerrando seu acesso…"}
        </p>
        {error && <a href="/restaurantes/login">Voltar ao login</a>}
      </div>
    </main>
  );
}
