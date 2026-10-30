"use client";
import { useEffect, useState } from "react";
import { salonOperation, salonError } from "@/lib/salon/service";
import type { SalonTab } from "@/lib/salon/types";
import { money, paymentLabels } from "@/lib/salon/types";
type Result = {
  tabs: (SalonTab & { tableName: string; tableId: string })[];
  cursor: { closedAt: number; id: string } | null;
};
export default function SalonHistory({ storeId }: { storeId: string }) {
  const [tabs, setTabs] = useState<Result["tabs"]>([]),
    [cursor, setCursor] = useState<Result["cursor"]>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    salonOperation<Result>("history", { storeId })
      .then((result) => {
        if (!cancelled) {
          setTabs(result.tabs);
          setCursor(result.cursor);
        }
      })
      .catch((reason) => {
        if (!cancelled) setError(salonError(reason));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [storeId]);
  async function more() {
    if (!cursor || loading) return;
    setLoading(true);
    try {
      const result = await salonOperation<Result>("history", {
        storeId,
        cursor,
      });
      setTabs((current) => [
        ...current,
        ...result.tabs.filter(
          (tab) => !current.some((item) => item.id === tab.id),
        ),
      ]);
      setCursor(result.cursor);
      setError("");
    } catch (reason) {
      setError(salonError(reason));
    } finally {
      setLoading(false);
    }
  }
  return (
    <section className="salon-history">
      <h2>Contas encerradas</h2>
      <p>
        As comandas permanecem registradas após a limpeza e a liberação da mesa.
      </p>
      {error && <p role="alert">{error}</p>}
      {tabs.map((tab) => (
        <details key={tab.id}>
          <summary>
            <strong>{tab.tableName}</strong>
            <span>
              {tab.closedAt
                ? new Date(tab.closedAt).toLocaleString("pt-BR")
                : ""}
            </span>
            <strong>{money(tab.totalCents)}</strong>
          </summary>
          <ul className="salon-lines">
            {tab.lines.map((line, index) => (
              <li key={index}>
                <span>
                  {line.quantity} × {line.name}
                </span>
                <strong>{money(line.priceCents * line.quantity)}</strong>
              </li>
            ))}
          </ul>
          <p>
            Subtotal {money(tab.subtotalCents)} · Desconto{" "}
            {money(tab.discountCents)}
          </p>
          {tab.discountReason && (
            <p>Motivo do desconto: {tab.discountReason}</p>
          )}
          <ul className="salon-payments">
            {tab.payments.map((payment) => (
              <li key={payment.id}>
                <span>
                  {paymentLabels[payment.method]}
                  {payment.payer ? ` · ${payment.payer}` : ""}
                  {payment.voided ? " · Anulado" : ""}
                </span>
                <strong>{money(payment.amountCents)}</strong>
              </li>
            ))}
          </ul>
          <p>Total registrado: {money(tab.paidCents)} · Conta quitada</p>
        </details>
      ))}
      {loading ? (
        <p role="status">Carregando contas…</p>
      ) : cursor ? (
        <button className="button" onClick={() => void more()}>
          Carregar mais contas
        </button>
      ) : !tabs.length ? (
        <p>Nenhuma conta encerrada.</p>
      ) : null}
    </section>
  );
}
