"use client";
import { useState } from "react";
import { useStoreSettings } from "../settings/store-settings-provider";
import { usePathname } from "next/navigation";
export default function DashboardHeader() {
  const pathname = usePathname();
  const { data, loading, error, setReceivingOrders } = useStoreSettings();
  const [saving, setSaving] = useState(false);
  const [receivingError, setReceivingError] = useState("");
  const receiving = data?.receivingOrders === true;
  const canChange =
    !loading && ["configured", "active"].includes(String(data?.status));
  async function toggleReceiving() {
    if (saving || !canChange) return;
    setSaving(true);
    setReceivingError("");
    try {
      await setReceivingOrders(!receiving);
    } catch {
      setReceivingError(
        "Não foi possível alterar o recebimento. Tente novamente.",
      );
    } finally {
      setSaving(false);
    }
  }
  const isHelp = pathname.endsWith("/dashboard/ajuda");
  const isApps = pathname.includes("/aplicativos");
  const isSalon = pathname.includes("/salao");
  const isWaiters = pathname.includes("/garcons");
  const isOrders = pathname.includes("/pedidos");
  const isMenu = pathname.includes("/cardapio");
  const isCouriers = pathname.includes("/entregadores");
  return (
    <header className={"dashboard-top"}>
      <span>
        {"Restaurante / "}
        <strong id={"breadcrumb"}>
          {isMenu
            ? "Cardápio"
            : isCouriers
              ? "Entregadores"
              : isWaiters
                ? "Garçons"
                : isOrders
                  ? "Pedidos"
                  : isSalon
                    ? "Salão"
                    : isApps
                      ? "Aplicativos"
                      : isHelp
                        ? "Ajuda e suporte"
                        : "Visão geral"}
        </strong>
      </span>
      {!isMenu &&
        !isCouriers &&
        !isWaiters &&
        !isSalon &&
        !isOrders &&
        !isApps &&
        !isHelp && (
          <div className="receiving-control">
            <button
              type={"button"}
              id={"store-toggle"}
              className={"store-switch"}
              role={"switch"}
              aria-checked={receiving}
              aria-label={"Receber pedidos"}
              disabled={!canChange || saving}
              aria-busy={saving}
              title={
                !canChange
                  ? error ||
                    "Conclua o cadastro da loja para habilitar o recebimento."
                  : data?.status !== "active"
                    ? "A loja ainda depende da liberação da plataforma para aparecer aos clientes."
                    : undefined
              }
              onClick={toggleReceiving}
            >
              <svg
                xmlns={"http://www.w3.org/2000/svg"}
                width={"20"}
                height={"20"}
                viewBox={"0 0 24 24"}
                fill={"none"}
                stroke={"currentColor"}
                strokeWidth={"2"}
                strokeLinecap={"round"}
                strokeLinejoin={"round"}
                className={"lucide lucide-store"}
                aria-hidden={"true"}
                focusable={"false"}
              >
                <path d={"M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5"}></path>
                <path
                  d={
                    "M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244"
                  }
                ></path>
                <path
                  d={"M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05"}
                ></path>
              </svg>
              <span id={"store-status"}>
                {saving
                  ? "Salvando…"
                  : loading
                    ? "Carregando…"
                    : receiving
                      ? "Recebendo pedidos"
                      : "Recebimento pausado"}
              </span>
              <span className={"switch-track"} aria-hidden={"true"}></span>
            </button>
            {receivingError && (
              <p role="alert" className="receiving-error">
                {receivingError}
              </p>
            )}
          </div>
        )}
    </header>
  );
}
