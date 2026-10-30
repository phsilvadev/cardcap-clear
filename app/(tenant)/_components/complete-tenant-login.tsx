"use client";
import { useEffect, useRef, useState } from "react";
import { signInWithCustomToken } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { establishSession } from "@/lib/auth/tenant-client";
export default function CompleteTenantLogin() {
  const started = useRef(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void (async () => {
      try {
        const response = await fetch("/api/auth/transfer", {
          headers: { "X-Cardap-Transfer": "1" },
          cache: "no-store",
        });
        if (!response.ok) throw new Error();
        const data = await response.json();
        const { user } = await signInWithCustomToken(
          getFirebaseAuth(),
          data.customToken,
        );
        await establishSession(user);
        window.location.replace(data.path);
      } catch {
        setError(
          "Não foi possível concluir o acesso. Entre novamente no restaurante.",
        );
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
        <div className="wordmark text-3xl">
          cardap<span className="text-brand">.</span>
        </div>
        <p style={{ marginTop: 20 }} role="status">
          {error || "Preparando seu acesso ao restaurante…"}
        </p>
        {error && (
          <a href="/restaurantes/login" className="button primary">
            Voltar ao login
          </a>
        )}
      </div>
    </main>
  );
}
