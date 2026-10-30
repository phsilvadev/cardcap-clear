"use client";
import { useState } from "react";
import { useTenantOrders } from "./tenant-orders-provider";
export default function OrderAutomation() {
  const orders = useTenantOrders();
  const [confirm, setConfirm] = useState<string | null>(null);
  const [error, setError] = useState("");
  const ownDevice = Boolean(
    orders.desktop?.deviceId &&
    orders.printing.deviceId === orders.desktop.deviceId,
  );
  return (
    <div className="order-automation">
      <label className="order-auto-switch">
        <span>
          Aceitar automaticamente
          <small>Configuração da loja, salva no Firebase.</small>
        </span>
        <input
          type="checkbox"
          role="switch"
          checked={orders.printing.autoAccept}
          disabled={orders.loading || orders.busy}
          onChange={(event) => orders.setAutoAccept(event.target.checked)}
        />
      </label>
      <div className="order-print-tools">
        <p>
          {orders.printing.deviceId
            ? `Impressão: ${orders.printing.deviceName || "computador selecionado"}${ownDevice ? " (este computador)" : ""}`
            : "Nenhum computador responsável pela impressão."}
        </p>
        {orders.desktop && (
          <>
            <button
              className="text-button"
              type="button"
              onClick={() => {
                void window.cardapPrinter
                  ?.configure()
                  .catch(() =>
                    setError("Não foi possível abrir a configuração."),
                  );
              }}
            >
              Configurar impressora
            </button>
            {!ownDevice && (
              <button
                className="text-button"
                disabled={orders.busy || !orders.desktop.configured}
                type="button"
                onClick={() => setConfirm("device")}
              >
                Usar este computador para imprimir
              </button>
            )}
          </>
        )}
        {!orders.desktop && (
          <p>Abra o Cardap Impressão para vincular um computador.</p>
        )}
        {ownDevice && (
          <button
            type="button"
            className="text-button"
            disabled={orders.busy}
            onClick={() => orders.setDevice("", "")}
          >
            Pausar impressão automática
          </button>
        )}
        {orders.desktop?.error && <p role="status">{orders.desktop.error}</p>}
      </div>
      {orders.attention.length > 0 && (
        <details>
          <summary>
            {orders.attention.length} comanda(s) em envio ou revisão
          </summary>
          {orders.attention.map((job) => (
            <div key={job.id}>
              <span>
                #{job.orderId} ·{" "}
                {job.state === "printing" ? "Em envio" : "Conferir impressão"}
              </span>
              <button
                className="text-button"
                type="button"
                disabled={orders.busy}
                onClick={() => setConfirm(job.id)}
              >
                Revisar
              </button>
            </div>
          ))}
        </details>
      )}
      {confirm && (
        <div
          className="order-print-confirm"
          role="group"
          aria-label="Confirmar alteração"
        >
          <p>
            {confirm === "device"
              ? "Este computador passará a imprimir as próximas comandas desta loja. O anterior deixará de receber novos envios."
              : "Confira se a comanda já saiu na impressora. Reenviar pode gerar uma segunda via. Se o envio começou agora, aguarde dois minutos."}
          </p>
          <button
            className="text-button"
            type="button"
            disabled={orders.busy}
            onClick={() => {
              if (confirm === "device" && orders.desktop)
                orders.setDevice(
                  orders.desktop.deviceId,
                  orders.desktop.deviceName,
                );
              else orders.retryPrint(confirm);
              setConfirm(null);
            }}
          >
            Confirmar
          </button>
          <button
            className="text-button"
            type="button"
            onClick={() => setConfirm(null)}
          >
            Voltar
          </button>
        </div>
      )}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
