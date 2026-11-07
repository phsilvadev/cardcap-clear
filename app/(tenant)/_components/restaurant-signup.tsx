"use client";

import BotProtectionNotice from "./bot-protection-notice";
import SignupIcon from "./signup-icon";

import { useRestaurantSignup } from "@/app/(tenant)/_hooks/use-restaurant-signup";

const RestaurantSignup = () => {
  const {
    showPassword,
    status,
    loading,
    togglePassword,
    clearStatus,
    handleSubmit,
  } = useRestaurantSignup();

  return (
    <form
      className="restaurant-login-form restaurant-signup-form"
      onSubmit={handleSubmit}
      onChange={clearStatus}
      aria-label="Cadastro do restaurante"
    >
      <div className="restaurant-signup-field">
        <label htmlFor="signup-owner">
          <SignupIcon name="user" />
          Seu nome <span aria-hidden="true">*</span>
        </label>
        <input
          id="signup-owner"
          required
          minLength={3}
          maxLength={100}
          name="ownerName"
          type="text"
          autoComplete="name"
          placeholder="Nome do responsável"
        />
      </div>
      <div className="restaurant-signup-field">
        <label htmlFor="signup-store">
          <SignupIcon name="store" />
          Nome do restaurante <span aria-hidden="true">*</span>
        </label>
        <input
          id="signup-store"
          required
          minLength={3}
          maxLength={80}
          name="storeName"
          type="text"
          autoComplete="organization"
          placeholder="Ex.: Hero Burgues"
        />
      </div>
      <div className="restaurant-signup-field restaurant-signup-full">
        <label htmlFor="signup-email">
          <SignupIcon name="mail" />
          E-mail <span aria-hidden="true">*</span>
        </label>
        <input
          id="signup-email"
          required
          maxLength={254}
          name="email"
          type="email"
          autoComplete="email"
          placeholder="voce@restaurante.com.br"
        />
      </div>
      <div className="restaurant-signup-field">
        <label htmlFor="signup-password">
          <SignupIcon name="lock" />
          Senha <span aria-hidden="true">*</span>
        </label>
        <div className="restaurant-password-field">
          <input
            id="signup-password"
            required
            minLength={8}
            maxLength={128}
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
            aria-label={showPassword ? "Ocultar senhas" : "Mostrar senhas"}
          >
            <SignupIcon name="eye" />
          </button>
        </div>
      </div>
      <div className="restaurant-signup-field">
        <label htmlFor="signup-confirmation">
          <SignupIcon name="lock" />
          Confirme a senha <span aria-hidden="true">*</span>
        </label>
        <div className="restaurant-password-field">
          <input
            id="signup-confirmation"
            required
            name="confirmation"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Digite sua senha novamente"
          />
          <button
            type="button"
            onClick={togglePassword}
            aria-controls="signup-password signup-confirmation"
            aria-pressed={showPassword}
            aria-label={
              showPassword
                ? "Ocultar confirmação da senha"
                : "Mostrar confirmação da senha"
            }
          >
            <SignupIcon name="eye" />
          </button>
        </div>
      </div>
      <p className="restaurant-login-note restaurant-signup-full">
        <SignupIcon name="info" />
        Esta conta será usada para acessar e configurar seu restaurante na
        plataforma.
      </p>
      <BotProtectionNotice className="restaurant-signup-full" />
      <button
        className="restaurant-login-submit restaurant-signup-full"
        type="submit"
        disabled={loading}
      >
        {loading ? "Cadastrando…" : "Cadastrar restaurante"}{" "}
        <span aria-hidden="true">→</span>
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
