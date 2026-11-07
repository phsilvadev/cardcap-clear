"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import BrandLogo from "@/components/brand-logo";
import { getCustomerAuth } from "@/lib/firebase/client";
import {
  customerError,
  loginCustomer,
  registerCustomer,
  resetCustomerPassword,
} from "@/lib/customer/service";
import "../_styles/customer-area.css";

export default function CustomerAccess({
  mode = "login",
}: {
  mode?: "login" | "signup" | "reset";
}) {
  const router = useRouter(),
    params = useSearchParams();
  const next = params.get("next");
  const destination =
    next && /^\/(checkout|pagamento|carrinho|loja)(\?|$)/.test(next)
      ? next
      : "/cliente";
  const [show, setShow] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  useEffect(() => {
    if (mode !== "login") return;
    let stop = () => {};
    try {
      stop = onAuthStateChanged(getCustomerAuth(), (user) => {
        if (user) router.replace(destination);
      });
    } catch (reason) {
      setError(customerError(reason));
    }
    return stop;
  }, [mode, router, destination]);
  const query =
    destination !== "/cliente"
      ? `?next=${encodeURIComponent(destination)}`
      : "";
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") || ""),
      password = String(data.get("password") || "");
    setError("");
    setMessage("");
    if (mode === "signup" && password !== data.get("confirmation")) {
      setError("As senhas não conferem.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "reset") {
        try {
          await resetCustomerPassword(email);
        } catch (reason) {
          if ((reason as { code?: string }).code !== "auth/user-not-found")
            throw reason;
        }
        setMessage(
          "Se este e-mail tem uma conta, você receberá as instruções para redefinir a senha. Confira também o spam.",
        );
      } else {
        if (mode === "signup")
          await registerCustomer(
            String(data.get("name") || ""),
            email,
            password,
            String(data.get("phone") || ""),
          );
        else await loginCustomer(email, password);
        router.replace(destination);
      }
    } catch (reason) {
      setError(customerError(reason));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="customer-shell">
      <header className="customer-header">
        <a href="/" aria-label="Cardap — início">
          <BrandLogo />
        </a>
        <a href="/">← Voltar ao início</a>
      </header>
      <main className="customer-access-layout">
        <section className="customer-access-intro">
          <span className="customer-eyebrow">Sua cidade. Seus sabores.</span>
          <h1>
            Seu próximo sabor
            <br />
            começa <em>aqui.</em>
          </h1>
          <p>
            Entre na sua conta para acompanhar pedidos, salvar seus endereços e
            encontrar seus restaurantes favoritos.
          </p>
          <a href="/#buscar">Explorar restaurantes →</a>
        </section>
        <section
          className="customer-panel customer-access-card"
          aria-labelledby="customer-access-title"
        >
          <p className="customer-eyebrow">Área do cliente</p>
          <h2 id="customer-access-title">
            {mode === "signup"
              ? "Vamos criar sua conta?"
              : mode === "reset"
                ? "Esqueceu sua senha?"
                : "Bom ter você por aqui."}
          </h2>
          <p>
            {mode === "signup"
              ? "Seus dados para pedir com mais praticidade."
              : mode === "reset"
                ? "Informe o e-mail cadastrado para receber as instruções."
                : "Entre com seu e-mail e senha."}
          </p>
          <form
            onSubmit={submit}
            className="customer-form"
            aria-label={
              mode === "signup"
                ? "Cadastro do cliente"
                : mode === "reset"
                  ? "Recuperar senha"
                  : "Login do cliente"
            }
          >
            {mode === "signup" && (
              <>
                <label>
                  Seu nome
                  <input
                    name="name"
                    autoComplete="name"
                    minLength={2}
                    maxLength={100}
                    required
                  />
                </label>
                <label>
                  Telefone com DDD
                  <input
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    maxLength={20}
                    pattern="[0-9 ()+\-]{10,20}"
                    placeholder="(11) 99999-9999"
                    required
                  />
                </label>
              </>
            )}
            <label>
              E-mail
              <input
                name="email"
                type="email"
                autoComplete="email"
                maxLength={254}
                required
              />
            </label>
            {mode !== "reset" && (
              <>
                <label>
                  Senha
                  <div className="customer-password">
                    <input
                      id="customer-password"
                      name="password"
                      type={show ? "text" : "password"}
                      autoComplete={
                        mode === "signup" ? "new-password" : "current-password"
                      }
                      minLength={mode === "signup" ? 8 : undefined}
                      maxLength={128}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShow(!show)}
                      aria-pressed={show}
                      aria-controls={
                        mode === "signup"
                          ? "customer-password customer-confirmation"
                          : "customer-password"
                      }
                    >
                      {show ? "Ocultar" : "Mostrar"}
                    </button>
                  </div>
                </label>
                {mode === "signup" && (
                  <label>
                    Confirme a senha
                    <input
                      id="customer-confirmation"
                      name="confirmation"
                      type={show ? "text" : "password"}
                      autoComplete="new-password"
                      minLength={8}
                      maxLength={128}
                      required
                    />
                  </label>
                )}
              </>
            )}
            {mode === "login" && (
              <a
                className="customer-text-link"
                href={`/cliente/recuperar-senha${query}`}
              >
                Esqueci minha senha
              </a>
            )}
            {error && (
              <p className="customer-error" role="alert">
                {error}
              </p>
            )}
            {message && (
              <p className="customer-success" role="status">
                {message}
              </p>
            )}
            <button
              type="submit"
              className="customer-button customer-primary"
              disabled={busy}
            >
              {busy
                ? "Aguarde…"
                : mode === "signup"
                  ? "Criar minha conta"
                  : mode === "reset"
                    ? "Enviar instruções"
                    : "Entrar"}
              <span aria-hidden="true">→</span>
            </button>
          </form>
          <p className="customer-access-switch">
            {mode === "login" ? (
              <>
                Ainda não tem conta?{" "}
                <a href={`/cliente/cadastro${query}`}>Cadastre-se</a>
              </>
            ) : (
              <>
                Já tem uma conta? <a href={`/cliente/login${query}`}>Entrar</a>
              </>
            )}
          </p>
          <p className="customer-access-partner">
            Tem um restaurante?{" "}
            <a href="/restaurantes/login">Acesse a área de parceiros</a>
          </p>
        </section>
      </main>
      <footer className="customer-footer">
        Cardap · Sua próxima refeição começa aqui.
      </footer>
    </div>
  );
}
