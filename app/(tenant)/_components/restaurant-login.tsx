"use client";

import { useState, type FormEvent } from "react";
import { loginRestaurant, authMessage } from "@/lib/auth/tenant-client";

export default function RestaurantLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState("");

  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    const data = new FormData(event.currentTarget);
    setLoading(true);
    setStatus("");
    try {
      await loginRestaurant(
        String(data.get("email") ?? ""),
        String(data.get("password") ?? ""),
      );
      window.location.replace("/dashboard");
    } catch (error) {
      setStatus(authMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="restaurant-login-form" onSubmit={handleSubmit}>
      <label htmlFor="restaurant-email">E-mail</label>
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
      <label htmlFor="restaurant-password">Senha</label>
      <div className="restaurant-password-field">
        <input
          id="restaurant-password"
          name="password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          required
          onChange={() => setStatus("")}
        />
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
      <button
        className="restaurant-login-submit"
        type="submit"
        disabled={loading}
      >
        {loading ? "Entrando…" : "Entrar no restaurante"}{" "}
        <span aria-hidden="true">↗</span>
      </button>
      <p className="restaurant-login-status" role="status" aria-live="polite">
        {status}
      </p>
    </form>
  );
}
