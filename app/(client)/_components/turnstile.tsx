"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type TurnstileApi = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  remove: (id: string) => void;
};

export default function Turnstile({
  onToken,
}: {
  onToken: (token: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();

  useEffect(() => {
    const api = (window as Window & { turnstile?: TurnstileApi }).turnstile;
    if (!ready || !api || !container.current || !siteKey) return;
    const id = api.render(container.current, {
      sitekey: siteKey,
      action: "launch_signup",
      theme: "light",
      size: "flexible",
      language: "pt-br",
      callback: (token: string) => {
        setFailed(false);
        onToken(token);
      },
      "expired-callback": () => onToken(""),
      "error-callback": () => {
        onToken("");
        setFailed(true);
      },
    });
    return () => api.remove(id);
  }, [ready, siteKey, onToken]);

  if (!siteKey)
    return (
      <p className="launch-error" role="status">
        As inscrições estão temporariamente indisponíveis. Tente novamente mais
        tarde.
      </p>
    );

  return (
    <div className="launch-turnstile">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        onReady={() => setReady(true)}
        onError={() => setFailed(true)}
      />
      <div ref={container} />
      {failed && (
        <p className="launch-error" role="alert">
          Não foi possível carregar a verificação de segurança. Atualize a
          página para tentar novamente.
        </p>
      )}
    </div>
  );
}
