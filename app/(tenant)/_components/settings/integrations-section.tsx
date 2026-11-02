"use client";

import { useCallback, useEffect, useState } from "react";
import Dialog from "../products/product-dialog";
import WhatsAppIntegrationSettings from "./whatsapp-integration-settings";
import WhatsAppConnectionDrawer from "./whatsapp-connection-drawer";

const integrations = [
  {
    id: "whatsapp",
    title: "WhatsApp",
    subtitle: "API não oficial · Evolution API",
    description:
      "Conecte o WhatsApp do restaurante pelo QR Code e acompanhe o status da conexão.",
    icon: "chat",
    color: "green",
  },
  {
    id: "whatsapp-official",
    title: "WhatsApp Business",
    subtitle: "API oficial · Meta",
    description:
      "Uma futura opção para integrar a comunicação do restaurante com a plataforma oficial do WhatsApp.",
    icon: "business",
    color: "green",
  },
  {
    id: "instagram",
    title: "Instagram",
    subtitle: "Perfil do restaurante",
    description:
      "Uma futura integração para aproximar seu perfil no Instagram da operação do restaurante.",
    icon: "instagram",
    color: "pink",
  },
  {
    id: "email",
    title: "E-mail",
    subtitle: "Notificações e comunicação",
    description:
      "Uma futura integração para enviar avisos e novidades do restaurante por e-mail.",
    icon: "email",
    color: "blue",
  },
] as const;

function IntegrationIcon({
  type,
}: {
  type: (typeof integrations)[number]["icon"];
}) {
  return (
    <svg
      width="25"
      height="25"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {type === "instagram" ? (
        <>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <path d="M17.5 6.5h.01" />
        </>
      ) : type === "email" ? (
        <>
          <rect x="3" y="5" width="18" height="14" rx="3" />
          <path d="m3 7 9 6 9-6" />
        </>
      ) : (
        <>
          <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" />
          {type === "business" ? (
            <path d="M9 8h3a2 2 0 0 1 0 4H9m0-4v8h3a2 2 0 0 0 0-4H9" />
          ) : (
            <path d="M8.5 8.5c0 3.5 3.5 7 7 7l1-2-2-1-1 1c-1.5-.5-2.5-1.5-3-3l1-1-1-2-2 1Z" />
          )}
        </>
      )}
    </svg>
  );
}

export default function IntegrationsSection({
  storeId,
  enabled = false,
}: {
  storeId?: string;
  enabled?: boolean;
}) {
  const [selected, setSelected] = useState<
    (typeof integrations)[number] | null
  >(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const handleConnected = useCallback(() => {
    setWhatsappConnected(true);
    setSelected(null);
    setDrawerOpen(true);
  }, []);
  const handleStateChange = useCallback((state: string) => {
    setWhatsappConnected(state === "connected");
  }, []);
  const overlayOpen = Boolean(selected) || drawerOpen;
  useEffect(() => {
    if (!enabled) {
      setSelected(null);
      setDrawerOpen(false);
    }
  }, [enabled]);
  useEffect(() => {
    if (!overlayOpen) return;
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = previous;
    };
  }, [overlayOpen]);
  return (
    <>
      <div className="integrations-grid">
        {integrations.map((integration) => (
          <article className="integration-card" key={integration.id}>
            <div className="integration-card-heading">
              <span
                className="integration-card-icon"
                data-color={integration.color}
              >
                <IntegrationIcon type={integration.icon} />
              </span>
              <div>
                <h3>{integration.title}</h3>
                <p>{integration.subtitle}</p>
              </div>
            </div>
            <p className="integration-card-description">
              {integration.description}
            </p>
            <div className="integration-card-footer">
              <span className="integration-card-label">
                {integration.id === "whatsapp"
                  ? whatsappConnected
                    ? "Conectado"
                    : "Conexão por QR Code"
                  : "Em breve"}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (integration.id === "whatsapp" && whatsappConnected)
                    setDrawerOpen(true);
                  else setSelected(integration);
                }}
                aria-label={`${integration.id === "whatsapp" && whatsappConnected ? "Gerenciar" : "Configurar"} ${integration.title}${integration.id === "whatsapp" ? " não oficial" : ""}`}
              >
                {integration.id === "whatsapp" && whatsappConnected
                  ? "Gerenciar"
                  : "Configurar"}{" "}
                <span aria-hidden="true">↗</span>
              </button>
            </div>
          </article>
        ))}
      </div>
      <Dialog
        id="integration-config-dialog"
        title={
          selected ? `Configurar ${selected.title}` : "Configurar integração"
        }
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
      >
        {selected?.id === "whatsapp" ? (
          <WhatsAppIntegrationSettings
            storeId={storeId}
            enabled={enabled}
            onConnected={handleConnected}
            onStateChange={handleStateChange}
          />
        ) : selected ? (
          <div className="integration-preview">
            <span className="integration-card-icon" data-color={selected.color}>
              <IntegrationIcon type={selected.icon} />
            </span>
            <span className="integration-preview-badge">Em breve</span>
            <h3>Esta integração ainda está em preparação.</h3>
            <p>{selected.description}</p>
            <p>
              As opções de configuração serão disponibilizadas aqui quando a
              integração estiver pronta.
            </p>
            <button type="button" onClick={() => setSelected(null)}>
              Entendi
            </button>
          </div>
        ) : null}
      </Dialog>
      <WhatsAppConnectionDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        storeId={storeId}
        enabled={enabled}
        onStateChange={handleStateChange}
      />
    </>
  );
}
