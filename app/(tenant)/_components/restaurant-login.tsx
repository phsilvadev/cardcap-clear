"use client";

import { useEffect, useState, type FormEvent } from "react";
import BotProtectionNotice from "./bot-protection-notice";
import { getFirebaseAuth } from "@/lib/firebase/client";
import {
  loginRestaurant,
  establishSession,
  openTenantDashboard,
  authMessage,
} from "@/lib/auth/tenant-client";

export default function RestaurantLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const restore = async () => {
      try {
        const auth = getFirebaseAuth();
        await auth.authStateReady();
        if (cancelled) return;
        if (auth.currentUser) {
          const session = await establishSession(auth.currentUser);
          if (!cancelled)
            await openTenantDashboard(
              auth.currentUser,
              window.cardapPrinter ? "/dashboard/pedidos" : "/dashboard",
              session,
            );
          return;
        }
      } catch {
        if (!cancelled)
          setStatus("Não foi possível restaurar sua sessão. Entre novamente.");
      }
      if (!cancelled) void window.cardapPrinter?.ready?.().catch(() => {});
    };
    void restore();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    const data = new FormData(event.currentTarget);
    setLoading(true);
    setStatus("");
    try {
      const access = await loginRestaurant(
        String(data.get("email") ?? ""),
        String(data.get("password") ?? ""),
      );
      await openTenantDashboard(
        access.user,
        window.cardapPrinter ? "/dashboard/pedidos" : "/dashboard",
        access.session,
      );
    } catch (error) {
      setStatus(authMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="restaurant-login-form" onSubmit={handleSubmit}>
      <label htmlFor="restaurant-email">E-mail</label>
      <div className="restaurant-login-input">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="m3 5 9 8 9-8" />
        </svg>
        <input
          id="restaurant-email"
          name="email"
          type="email"
          autoComplete="username"
          placeholder="voce@restaurante.com.br"
          maxLength={254}
          required
          onChange={() => setStatus("")}
        />
      </div>
      <label htmlFor="restaurant-password">Senha</label>
      <div className="restaurant-password-field">
        <div className="restaurant-login-input">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <rect x="4" y="10" width="16" height="11" rx="2" />
            <path d="M8 10V6a4 4 0 0 1 8 0v4" />
            <path d="M12 14v3" />
          </svg>
          <input
            id="restaurant-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            required
            onChange={() => setStatus("")}
          />
          <svg
            className="restaurant-password-eye"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
            {showPassword && <path d="m3 3 18 18" />}
          </svg>
        </div>
        <button
          type="button"
          aria-controls="restaurant-password"
          aria-pressed={showPassword}
          onClick={() => setShowPassword((value) => !value)}
        >
          {showPassword ? "Ocultar senha" : "Mostrar senha"}
        </button>
      </div>
      <p className="restaurant-login-note">
        Entre com a conta do proprietário para acessar seu restaurante.
      </p>
      <BotProtectionNotice />
      <button
        className="restaurant-login-submit"
        type="submit"
        disabled={loading}
      >
        {loading ? "Entrando…" : "Entrar no restaurante"}{" "}
        <span aria-hidden="true">→</span>
      </button>
      <p className="restaurant-login-status" role="status" aria-live="polite">
        {status}
      </p>
    </form>
  );
}
