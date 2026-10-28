"use client";

import { useRestaurantSignup } from "@/app/(tenant)/_hooks/use-restaurant-signup";

const RestaurantSignup = () => {
  const { showPassword, status, togglePassword, clearStatus, handleSubmit } =
    useRestaurantSignup();

  return (
    <form
      className="restaurant-login-form restaurant-signup-form"
      onSubmit={handleSubmit}
      onChange={clearStatus}
      aria-label="Cadastro do restaurante"
      noValidate
    >
      <div className="restaurant-signup-field">
        <label htmlFor="signup-owner">Seu nome</label>
        <input
          id="signup-owner"
          name="ownerName"
          type="text"
          autoComplete="name"
          placeholder="Nome do responsável"
        />
      </div>
      <div className="restaurant-signup-field">
        <label htmlFor="signup-store">Nome do restaurante</label>
        <input
          id="signup-store"
          name="storeName"
          type="text"
          autoComplete="organization"
          placeholder="Como seu restaurante se chama?"
        />
      </div>
      <div className="restaurant-signup-field restaurant-signup-full">
        <label htmlFor="signup-email">E-mail</label>
        <input
          id="signup-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="voce@restaurante.com.br"
        />
      </div>
      <div className="restaurant-signup-field restaurant-signup-full">
        <label htmlFor="signup-password">Senha</label>
        <div className="restaurant-password-field">
          <input
            id="signup-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Crie sua senha"
          />
          <button
            type="button"
            onClick={togglePassword}
            aria-controls="signup-password signup-confirmation"
            aria-pressed={showPassword}
          >
            {showPassword ? "Ocultar senhas" : "Mostrar senhas"}
          </button>
        </div>
      </div>
      <div className="restaurant-signup-field restaurant-signup-full">
        <label htmlFor="signup-confirmation">Confirme a senha</label>
        <input
          id="signup-confirmation"
          name="confirmation"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          placeholder="Digite sua senha novamente"
        />
      </div>
      <p className="restaurant-login-note restaurant-signup-full">
        Prévia visual: os dados não serão enviados nem salvos. Não informe uma
        senha real.
      </p>
      <button
        className="restaurant-login-submit restaurant-signup-full"
        type="submit"
      >
        Cadastrar restaurante <span aria-hidden="true">↗</span>
      </button>
      <p
        className="restaurant-login-status restaurant-signup-full"
        role="status"
        aria-live="polite"
      >
        {status}
      </p>
    </form>
  );
};

export default RestaurantSignup;
