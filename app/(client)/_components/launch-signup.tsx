"use client";

import { useRef, useState, type FormEvent } from "react";
import { httpsCallable } from "firebase/functions";
import { getFirebaseFunctions } from "@/lib/firebase/client";
import BotProtectionNotice from "@/app/(tenant)/_components/bot-protection-notice";

export default function LaunchSignup() {
  const [status, setStatus] = useState<"idle" | "saving" | "success">("idle");
  const [error, setError] = useState("");
  const pending = useRef(false);
  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    const values = new FormData(event.currentTarget);
    pending.current = true;
    setStatus("saving");
    setError("");
    try {
      const join = httpsCallable<
        Record<string, unknown>,
        { accepted: boolean }
      >(getFirebaseFunctions(), "publicJoinWaitlist");
      const response = await join({
        email: String(values.get("email") || "").trim(),
        consent: values.get("consent") === "on",
        website: values.get("website") || "",
      });
      if (!response.data.accepted) throw new Error("not-accepted");
      setStatus("success");
    } catch (cause) {
      const code = (cause as { code?: string })?.code;
      setError(
        code === "functions/resource-exhausted"
          ? "Muitas tentativas por agora. Aguarde alguns minutos e tente novamente."
          : "Não foi possível salvar sua inscrição. Tente novamente em instantes.",
      );
      setStatus("idle");
    } finally {
      pending.current = false;
    }
  }
  if (status === "success")
    return (
      <div className="launch-success" role="status" aria-live="polite">
        <span aria-hidden="true">✓</span>
        <div>
          <h2>Você está na lista!</h2>
          <p>
            Sua inscrição foi salva. Fique de olho no seu e-mail para as
            próximas novidades do Cardap.
          </p>
        </div>
      </div>
    );
  return (
    <form
      className="launch-form"
      onSubmit={subscribe}
      aria-label="Receber novidades do Cardap"
      aria-busy={status === "saving"}
    >
      <label htmlFor="launch-email">Seu melhor e-mail</label>
      <div className="launch-email-row">
        <input
          id="launch-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="voce@restaurante.com.br"
          required
          maxLength={254}
          disabled={status === "saving"}
          aria-describedby={error ? "launch-error" : undefined}
        />
        <button type="submit" disabled={status === "saving"}>
          {status === "saving" ? "Inscrevendo…" : "Quero fazer parte"}
          <span aria-hidden="true">↗</span>
        </button>
      </div>
      <div className="launch-trap" aria-hidden="true">
        <label htmlFor="launch-website">Site</label>
        <input
          id="launch-website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      <label className="launch-consent">
        <input
          type="checkbox"
          name="consent"
          required
          disabled={status === "saving"}
        />
        <span>
          Quero receber por e-mail novidades e avisos sobre a abertura do
          Cardap.
        </span>
      </label>
      <p className="launch-privacy">
        Seu e-mail será usado apenas para essas comunicações. A inscrição não
        cria uma conta nem garante acesso imediato.
      </p>
      <BotProtectionNotice />
      {error && (
        <p className="launch-error" id="launch-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
