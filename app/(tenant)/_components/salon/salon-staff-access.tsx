"use client";
import { useEffect, useState, type FormEvent } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { getFirebaseAuth, getFirebaseApp } from "@/lib/firebase/client";
import { webAppCheckHeaders } from "@/lib/firebase/app-check";
import { authMessage } from "@/lib/auth/tenant-client";
import SalonPage from "./salon-page";
export default function SalonStaffAccess() {
  const [signed, setSigned] = useState(false),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(
    () =>
      onAuthStateChanged(getFirebaseAuth(), (user) => {
        setSigned(!!user);
        setLoading(false);
      }),
    [],
  );
  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const fields = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const cleared = await fetch("/api/auth/session", { method: "DELETE" });
      if (!cleared.ok)
        throw new Error("Não foi possível preparar o acesso da equipe.");
      await webAppCheckHeaders(getFirebaseApp());
      await signInWithEmailAndPassword(
        getFirebaseAuth(),
        String(fields.get("email")).trim(),
        String(fields.get("password")),
      );
    } catch (reason) {
      setError(authMessage(reason));
    } finally {
      setBusy(false);
    }
  }
  if (loading) return <p role="status">Preparando acesso ao salão…</p>;
  return (
    <div className="salon-staff-shell">
      <header className="salon-staff-header">
        <a className="wordmark text-3xl" href="/">
          cardap<span className="text-brand">.</span>
        </a>
        {signed && (
          <button
            className="button"
            type="button"
            onClick={() =>
              void fetch("/api/auth/session", { method: "DELETE" })
                .then((response) => {
                  if (!response.ok) throw new Error("logout");
                  return signOut(getFirebaseAuth());
                })
                .catch(() =>
                  setError("Não foi possível sair. Tente novamente."),
                )
            }
          >
            Sair
          </button>
        )}
      </header>
      {error && <p role="alert">{error}</p>}
      {signed ? (
        <SalonPage />
      ) : (
        <form className="salon-login" onSubmit={login}>
          <p className="eyebrow">Acesso da equipe</p>
          <h1>Caixa do salão</h1>
          <p>
            Use o acesso liberado pelo proprietário. As permissões determinam
            quem pode receber pagamentos e aplicar descontos.
          </p>
          <label className="search-label">
            E-mail
            <input
              type="email"
              name="email"
              autoComplete="username"
              required
              maxLength={254}
            />
          </label>
          <label className="search-label">
            Senha
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
            />
          </label>
          <button className="button primary" disabled={busy}>
            {busy ? "Entrando…" : "Entrar no salão"}
          </button>
        </form>
      )}
    </div>
  );
}
