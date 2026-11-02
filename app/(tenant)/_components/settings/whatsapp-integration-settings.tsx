"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { getFirebaseFunctions } from "@/lib/firebase/client";

type Connection = {
  configured: boolean;
  state: "unavailable" | "connected" | "connecting" | "disconnected";
  qrCode: string | null;
  qrExpiresAt: number | null;
};
const labels = {
  unavailable: "Configuração pendente",
  connected: "Conectado",
  connecting: "Aguardando conexão",
  disconnected: "Desconectado",
};

export default function WhatsAppIntegrationSettings({
  storeId,
  enabled = false,
  onConnected,
  onStateChange,
}: {
  storeId?: string;
  enabled?: boolean;
  onConnected?: () => void;
  onStateChange?: (state: Connection["state"]) => void;
}) {
  const root = useRef<HTMLElement>(null);
  const scope = useRef(0);
  const pending = useRef(false);
  const polling = useRef(false);
  const [visible, setVisible] = useState(false);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [expired, setExpired] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  useEffect(() => {
    if (!connection) return;
    onStateChange?.(connection.state);
    if (connection.state === "connected") onConnected?.();
  }, [connection?.state, onConnected, onStateChange]);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) =>
      setVisible(entry.isIntersecting),
    );
    if (root.current) observer.observe(root.current);
    return () => observer.disconnect();
  }, []);
  const run = useCallback(
    async (action: "status" | "connect" | "disconnect") => {
      if (!storeId || pending.current) return;
      const version = scope.current;
      pending.current = true;
      setBusy(true);
      setError("");
      try {
        const call = httpsCallable<
          { storeId: string; action: string },
          Connection
        >(getFirebaseFunctions(), "tenantWhatsAppIntegration");
        const response = await call({ storeId, action });
        if (scope.current !== version) return;
        polling.current = ["connected", "connecting"].includes(
          response.data.state,
        );
        setConnection((previous) =>
          action === "status" &&
          response.data.state === "connecting" &&
          previous?.qrCode
            ? {
                ...response.data,
                qrCode: previous.qrCode,
                qrExpiresAt: previous.qrExpiresAt,
              }
            : response.data,
        );
        if (action !== "status" || response.data.state === "connected")
          setExpired(false);
        setConfirmDisconnect(false);
      } catch (cause) {
        if (scope.current !== version) return;
        polling.current = false;
        const code = (cause as { code?: string })?.code;
        setError(
          code === "functions/permission-denied" ||
            code === "functions/unauthenticated"
            ? "Entre com a conta do proprietário e conclua o cadastro da loja para gerenciar a conexão."
            : code === "functions/failed-precondition"
              ? "O suporte precisa configurar a Evolution API antes de conectar."
              : code === "functions/aborted" ||
                  code === "functions/resource-exhausted"
                ? "Aguarde alguns segundos antes de tentar novamente."
                : "Não foi possível atualizar a conexão. Confira sua internet e tente novamente.",
        );
      } finally {
        if (scope.current === version) {
          pending.current = false;
          setBusy(false);
        }
      }
    },
    [storeId],
  );
  useEffect(() => {
    scope.current++;
    pending.current = false;
    setConnection(null);
    setExpired(false);
    setError("");
    setConfirmDisconnect(false);
    if (!enabled || !visible || !storeId) {
      setBusy(false);
      return;
    }
    void run("status");
    const refresh = () => {
      if (!document.hidden && polling.current) void run("status");
    };
    const interval = window.setInterval(refresh, 10000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      scope.current++;
      pending.current = false;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [enabled, visible, storeId, run]);
  useEffect(() => {
    if (!connection?.qrExpiresAt) return;
    const timer = window.setTimeout(
      () => {
        setConnection((previous) =>
          previous ? { ...previous, qrCode: null, qrExpiresAt: null } : null,
        );
        setExpired(true);
      },
      Math.max(0, connection.qrExpiresAt - Date.now()),
    );
    return () => window.clearTimeout(timer);
  }, [connection?.qrExpiresAt]);
  return (
    <section
      ref={root}
      className="whatsapp-integration"
      aria-labelledby="whatsapp-integration-title"
    >
      <div className="whatsapp-integration-header">
        <div className="whatsapp-integration-identity">
          <span className="whatsapp-integration-icon" aria-hidden="true">
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" />
              <path d="M8.5 8.5c0 3.5 3.5 7 7 7l1-2-2-1-1 1c-1.5-.5-2.5-1.5-3-3l1-1-1-2-2 1Z" />
            </svg>
          </span>
          <div>
            <h3 id="whatsapp-integration-title">WhatsApp</h3>
            <p>Evolution API · API não oficial</p>
          </div>
        </div>
        <span
          className="team-badge"
          data-whatsapp-state={connection?.state}
          role="status"
        >
          {connection
            ? labels[connection.state]
            : busy
              ? "Consultando…"
              : "Não consultado"}
        </span>
      </div>
      <p className="whatsapp-integration-description">
        Conecte o WhatsApp do restaurante escaneando um QR Code. A conexão fica
        separada das outras lojas.
      </p>
      {connection?.state === "unavailable" && (
        <div className="whatsapp-integration-status">
          <span
            className="whatsapp-integration-status-dot"
            aria-hidden="true"
          />
          <div>
            <strong>Aguardando configuração do provedor</strong>
            <p>
              O suporte precisa habilitar a Evolution API para disponibilizar a
              conexão.
            </p>
          </div>
        </div>
      )}
      {connection?.state === "connected" && (
        <p className="whatsapp-connection-success">
          ✓ WhatsApp conectado ao restaurante.
        </p>
      )}
      {connection?.qrCode && (
        <div className="whatsapp-pairing">
          <img
            src={connection.qrCode}
            width="240"
            height="240"
            alt="QR Code para conectar o WhatsApp do restaurante"
          />
          <div>
            <h4>Conecte pelo seu celular</h4>
            <ol>
              <li>Abra o WhatsApp do restaurante.</li>
              <li>Acesse Aparelhos conectados → Conectar um aparelho.</li>
              <li>Aponte a câmera para este QR Code.</li>
            </ol>
            <p>O código expira em poucos segundos. Gere outro se necessário.</p>
          </div>
        </div>
      )}
      {expired && (
        <p role="status">
          O QR Code expirou. Gere um novo código para continuar.
        </p>
      )}
      {connection?.state === "connecting" && !connection.qrCode && !expired && (
        <p role="status">
          Aguardando conexão. Se o celular ainda não foi pareado, gere um novo
          QR Code.
        </p>
      )}
      <div className="whatsapp-integration-actions">
        {connection?.configured && connection.state !== "connected" && (
          <button
            className="whatsapp-connect-button"
            type="button"
            disabled={busy}
            onClick={() => void run("connect")}
          >
            {busy
              ? "Aguarde…"
              : connection.state === "connecting" || expired
                ? "Gerar novo QR Code"
                : "Conectar WhatsApp"}
          </button>
        )}
        <button
          type="button"
          disabled={busy || !storeId}
          onClick={() => void run("status")}
        >
          {busy ? "Atualizando…" : "Atualizar status"}
        </button>
        {connection?.configured && connection.state !== "disconnected" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirmDisconnect(true)}
          >
            Desconectar
          </button>
        )}
      </div>
      {confirmDisconnect && (
        <div className="whatsapp-disconnect-confirm">
          <p>
            Desconectar o WhatsApp deste restaurante? Será necessário escanear
            outro QR Code para conectar novamente.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void run("disconnect")}
          >
            Confirmar desconexão
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirmDisconnect(false)}
          >
            Cancelar
          </button>
        </div>
      )}
      {error && (
        <p className="whatsapp-integration-error" role="alert">
          {error}
        </p>
      )}
      <p className="whatsapp-integration-footnote">
        Você controla os avisos e as mensagens nas opções do painel.
      </p>
    </section>
  );
}
