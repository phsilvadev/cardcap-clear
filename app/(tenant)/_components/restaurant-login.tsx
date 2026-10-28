"use client";

import { useState, type FormEvent } from "react";

export default function RestaurantLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(
      "O login do restaurante ainda não está conectado. Nenhuma credencial foi enviada.",
    );
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
        Prévia visual: a autenticação ainda não está integrada. Não informe sua
        senha real.
      </p>
      <button className="restaurant-login-submit" type="submit">
        Entrar no restaurante <span aria-hidden="true">↗</span>
      </button>
      <p className="restaurant-login-status" role="status" aria-live="polite">
        {status}
      </p>
    </form>
  );
}
