"use client";
import { useState, type FormEvent } from "react";
import { useSalon } from "@/app/(tenant)/_hooks/use-salon";
import { money, tableLabels } from "@/lib/salon/types";
import SalonBill from "./salon-bill";
import SalonPermissions from "./salon-permissions";
import SalonHistory from "./salon-history";
import "@/app/(tenant)/_styles/salon.css";
export default function SalonPage({ storeId }: { storeId?: string }) {
  const control = useSalon(storeId),
    [view, setView] = useState("bills"),
    [selected, setSelected] = useState<string | null>(null),
    [name, setName] = useState("");
  const data = control.data;
  if (control.loading)
    return (
      <section
        className="salon-loading"
        role="status"
        aria-label="Carregando salão"
      >
        <div />
        <div />
        <div />
      </section>
    );
  if (!data)
    return (
      <section className="salon-empty">
        <h1>Salão</h1>
        <p role="alert">
          {control.error || "Entre com o acesso autorizado ao salão."}
        </p>
        <button
          className="button"
          type="button"
          onClick={() => void control.refresh()}
        >
          Tentar novamente
        </button>
      </section>
    );
  const bills = data.tables.filter(
    (table) => table.status === "bill_requested",
  );
  const table =
    data.tables.find((table) => table.id === selected) ??
    (view === "bills" ? bills[0] : undefined);
  const visible = view === "bills" ? bills : data.tables;
  const disabled = control.busy || !!control.pending;
  async function createTable(event: FormEvent) {
    event.preventDefault();
    if (await control.mutate("createTable", { name: name.trim() })) setName("");
  }
  return (
    <div className="salon-page">
      <header className="salon-heading">
        <div>
          <p className="eyebrow">Atendimento no restaurante</p>
          <h1>Salão</h1>
          <p>Da solicitação da conta à mesa pronta para receber novamente.</p>
        </div>
        <a href="/dashboard/garcons" className="button">
          Equipe de garçons
        </a>
      </header>
      <nav className="salon-tabs" aria-label="Seções do salão">
        <button
          aria-current={view === "bills" ? "page" : undefined}
          onClick={() => {
            setView("bills");
            setSelected(null);
          }}
        >
          Contas a fechar <span>{bills.length}</span>
        </button>
        <button
          aria-current={view === "tables" ? "page" : undefined}
          onClick={() => {
            setView("tables");
            setSelected(null);
          }}
        >
          Mesas <span>{data.tables.length}</span>
        </button>
        {data.actor.canReceive && (
          <button
            aria-current={view === "history" ? "page" : undefined}
            onClick={() => setView("history")}
          >
            Contas encerradas
          </button>
        )}
        {data.actor.canManage && (
          <button
            aria-current={view === "permissions" ? "page" : undefined}
            onClick={() => setView("permissions")}
          >
            Permissões do caixa
          </button>
        )}
      </nav>
      {control.error && (
        <p className="salon-error" role="alert">
          {control.error}
        </p>
      )}
      {control.pending && (
        <div className="salon-pending" role="status">
          <p>
            {control.busy
              ? "Confirmando operação com o restaurante…"
              : "O último envio ainda precisa de confirmação. Repita o mesmo envio para conferir sem duplicar registros."}
          </p>
          {!control.busy && (
            <button
              className="button"
              onClick={() => void control.retryPending()}
            >
              Repetir envio com segurança
            </button>
          )}
        </div>
      )}
      {view === "history" ? (
        <SalonHistory storeId={data.actor.storeId} />
      ) : view === "permissions" ? (
        <SalonPermissions
          storeId={data.actor.storeId}
          mutate={control.mutate}
          disabled={disabled}
        />
      ) : (
        <>
          {view === "tables" && data.actor.canManage && (
            <form className="salon-create" onSubmit={createTable}>
              <label className="search-label">
                Nova mesa
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  maxLength={40}
                  placeholder="Ex.: Mesa 01 ou Balcão 01"
                  disabled={disabled}
                />
              </label>
              <button className="button primary" disabled={disabled}>
                Cadastrar mesa
              </button>
            </form>
          )}
          <div className="salon-workspace">
            <aside
              className="salon-table-list"
              aria-label={
                view === "bills" ? "Contas solicitadas" : "Mesas do salão"
              }
            >
              {visible.length ? (
                visible.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className="salon-table-item"
                    aria-pressed={item.id === table?.id}
                    onClick={() => setSelected(item.id)}
                  >
                    <span>
                      <strong>{item.name}</strong>
                      <small>{tableLabels[item.status]}</small>
                    </span>
                    <span>{item.tab ? money(item.tab.totalCents) : "—"}</span>
                  </button>
                ))
              ) : (
                <div className="salon-empty">
                  <h2>
                    {view === "bills"
                      ? "Nenhuma conta aguardando fechamento"
                      : "Cadastre as mesas da loja"}
                  </h2>
                  <p>
                    {view === "bills"
                      ? "As solicitações dos garçons aparecerão aqui automaticamente."
                      : "As mesas cadastradas aparecerão no app da equipe."}
                  </p>
                </div>
              )}
            </aside>
            {table ? (
              <SalonBill
                key={table.tabId || table.id}
                table={table}
                actor={data.actor}
                orders={data.orders.filter(
                  (order) =>
                    order.tableId === table.id && order.tabId === table.tabId,
                )}
                mutate={control.mutate}
                disabled={disabled}
              />
            ) : (
              <section className="salon-empty">
                <h2>Selecione uma mesa</h2>
                <p>
                  Confira a comanda, os pagamentos e a próxima etapa do
                  atendimento.
                </p>
              </section>
            )}
          </div>
        </>
      )}
    </div>
  );
}
