"use client";

import { useEffect, useRef } from "react";
import WhatsAppIntegrationSettings from "./whatsapp-integration-settings";
import WhatsAppMessagingSettings from "./whatsapp-messaging-settings";

export default function WhatsAppConnectionDrawer({
  open,
  onClose,
  storeId,
  enabled,
  onStateChange,
}: {
  open: boolean;
  onClose: () => void;
  storeId?: string;
  enabled: boolean;
  onStateChange: (state: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal();
    if (!open && dialog.current?.open) dialog.current.close();
  }, [open]);
  return (
    <dialog
      ref={dialog}
      className="whatsapp-connection-drawer"
      aria-labelledby="whatsapp-drawer-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          onClose();
      }}
    >
      <header className="whatsapp-drawer-heading">
        <div>
          <p>Integrações da loja</p>
          <h2 id="whatsapp-drawer-title">Seu WhatsApp no Cardap</h2>
        </div>
        <button
          type="button"
          aria-label="Fechar painel do WhatsApp"
          onClick={onClose}
        >
          ✕
        </button>
      </header>
      {open && (
        <div className="whatsapp-drawer-body">
          <p className="whatsapp-drawer-intro">
            Acompanhe a conexão e veja o que está disponível para o seu
            restaurante.
          </p>
          <WhatsAppIntegrationSettings
            storeId={storeId}
            enabled={enabled}
            onStateChange={onStateChange}
          />
          <section
            className="whatsapp-drawer-orders"
            aria-labelledby="whatsapp-drawer-orders-title"
          >
            <h3 id="whatsapp-drawer-orders-title">Continue o atendimento</h3>
            <p>
              Consulte os pedidos para conferir os detalhes antes de conversar
              com o cliente.
            </p>
            <a href="/dashboard/pedidos">
              Abrir central de pedidos <span aria-hidden="true">↗</span>
            </a>
          </section>
          <WhatsAppMessagingSettings
            storeId={storeId}
            enabled={enabled && open}
          />
          <a className="whatsapp-drawer-help" href="/dashboard/ajuda">
            Precisa de ajuda com a conexão? →
          </a>
        </div>
      )}
    </dialog>
  );
}
