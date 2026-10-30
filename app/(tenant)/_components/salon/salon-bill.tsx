"use client";
import { useEffect, useState, type FormEvent } from "react";
import type { SalonState, SalonTable } from "@/lib/salon/types";
import {
  money,
  parseMoney,
  paymentLabels,
  tableLabels,
} from "@/lib/salon/types";
import { salonOperation } from "@/lib/salon/service";
type Mutate = (
  action: string,
  fields: Record<string, unknown>,
) => Promise<boolean>;
export default function SalonBill({
  table,
  actor,
  orders,
  mutate,
  disabled,
}: {
  table: SalonTable;
  actor: SalonState["actor"];
  orders: SalonState["orders"];
  mutate: Mutate;
  disabled: boolean;
}) {
  const tab = table.tab;
  const [guests, setGuests] = useState(2),
    [amount, setAmount] = useState(""),
    [method, setMethod] = useState("pix"),
    [payer, setPayer] = useState(""),
    [confirmed, setConfirmed] = useState(false);
  const [discount, setDiscount] = useState(
      tab ? String((tab.discountCents / 100).toFixed(2)) : "0",
    ),
    [reason, setReason] = useState(""),
    [parts, setParts] = useState(2),
    [suggestions, setSuggestions] = useState<number[]>([]);
  const [products, setProducts] = useState<
      { id: string; name: string; requiresCustomization: boolean }[]
    >([]),
    [productId, setProductId] = useState(""),
    [quantity, setQuantity] = useState(1);
  useEffect(() => {
    let cancelled = false;
    if (actor.canManage && tab?.status === "open")
      salonOperation<{ products: typeof products }>("menu", {
        storeId: actor.storeId,
      })
        .then((result) => {
          if (!cancelled)
            setProducts(
              result.products.filter(
                (product) => !product.requiresCustomization,
              ),
            );
        })
        .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [actor.storeId, actor.canManage, tab?.status]);
  const context = { tableId: table.id, tabId: table.tabId };
  async function pay(event: FormEvent) {
    event.preventDefault();
    if (!confirmed || !tab) return;
    if (
      await mutate("payment", {
        ...context,
        amountCents: parseMoney(amount),
        method,
        payer,
      })
    ) {
      setAmount("");
      setPayer("");
      setConfirmed(false);
    }
  }
  async function applyDiscount(event: FormEvent) {
    event.preventDefault();
    await mutate("discount", {
      ...context,
      amountCents: parseMoney(discount),
      reason,
    });
  }
  const canRequest =
    orders.length > 0 &&
    orders.every((order) => ["served", "cancelled"].includes(order.status));
  return (
    <article className="salon-detail">
      <header className="salon-detail-heading">
        <div>
          <p className="eyebrow">Atendimento no salão</p>
          <h2>{table.name}</h2>
        </div>
        <span className="salon-status" data-status={table.status}>
          {tableLabels[table.status]}
        </span>
      </header>
      {!tab ? (
        <>
          <p>A mesa está disponível para outro atendimento.</p>
          {actor.canManage && (
            <form
              className="salon-inline-form"
              onSubmit={(event) => {
                event.preventDefault();
                void mutate("open", { tableId: table.id, guests });
              }}
            >
              <label className="search-label">
                Pessoas
                <input
                  type="number"
                  value={guests}
                  min={1}
                  max={40}
                  onChange={(event) => setGuests(Number(event.target.value))}
                />
              </label>
              <button className="button primary" disabled={disabled}>
                Abrir mesa
              </button>
            </form>
          )}
          {actor.canManage && (
            <button
              type="button"
              className="salon-text-button"
              disabled={disabled}
              onClick={() => void mutate("archiveTable", { tableId: table.id })}
            >
              Arquivar mesa disponível
            </button>
          )}
        </>
      ) : (
        <>
          <div className="salon-totals">
            <div>
              <span>Total da conta</span>
              <strong>{money(tab.totalCents)}</strong>
            </div>
            <div>
              <span>Registrado</span>
              <strong>{money(tab.paidCents)}</strong>
            </div>
            <div>
              <span>Saldo restante</span>
              <strong>{money(tab.remainingCents)}</strong>
            </div>
          </div>
          <section>
            <h3>Itens da comanda</h3>
            {tab.lines.length ? (
              <ul className="salon-lines">
                {tab.lines.map((line, index) => (
                  <li key={`${line.orderId}-${index}`}>
                    <span>
                      {line.quantity} × {line.name}
                      <small>Pedido #{line.orderId}</small>
                    </span>
                    <strong>{money(line.priceCents * line.quantity)}</strong>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Nenhum item registrado nesta comanda.</p>
            )}
            <dl className="salon-summary">
              <div>
                <dt>Subtotal</dt>
                <dd>{money(tab.subtotalCents)}</dd>
              </div>
              <div>
                <dt>Desconto</dt>
                <dd>− {money(tab.discountCents)}</dd>
              </div>
              {!!tab.discountReason && <p>Motivo: {tab.discountReason}</p>}
            </dl>
          </section>
          {tab.status === "open" && actor.canManage && (
            <section>
              <h3>Adicionar pedido</h3>
              <form
                className="salon-inline-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  void mutate("send", {
                    ...context,
                    items: [{ productId, quantity }],
                    notes: "",
                  });
                }}
              >
                <label className="search-label">
                  Produto
                  <select
                    value={productId}
                    onChange={(event) => setProductId(event.target.value)}
                    required
                  >
                    <option value="">Selecione um produto</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="search-label">
                  Quantidade
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={quantity}
                    onChange={(event) =>
                      setQuantity(Number(event.target.value))
                    }
                  />
                </label>
                <button className="button" disabled={disabled || !productId}>
                  Enviar à cozinha
                </button>
              </form>
              <p className="salon-hint">
                Produtos com personalização obrigatória precisam de seleção dos
                complementos antes do envio.
              </p>
            </section>
          )}
          {tab.status === "open" && actor.canClean && (
            <div className="salon-actions">
              <button
                className="button primary"
                type="button"
                disabled={disabled || !canRequest}
                onClick={() => void mutate("requestBill", context)}
              >
                Solicitar conta ao caixa
              </button>
              {!orders.length && (
                <button
                  className="button"
                  type="button"
                  disabled={disabled}
                  onClick={() => void mutate("cancelEmpty", context)}
                >
                  Cancelar abertura sem pedidos
                </button>
              )}
              <p className="salon-hint">
                A conta só pode ser solicitada após servir os pedidos pendentes.
              </p>
            </div>
          )}
          {tab.status === "requested" && (
            <>
              {actor.canDiscount && (
                <section>
                  <h3>Desconto autorizado</h3>
                  <form
                    className="salon-discount-form"
                    onSubmit={applyDiscount}
                  >
                    <label className="search-label">
                      Desconto em reais
                      <input
                        inputMode="decimal"
                        value={discount}
                        onChange={(event) => setDiscount(event.target.value)}
                        disabled={
                          disabled ||
                          tab.payments.some((payment) => !payment.voided)
                        }
                        required
                      />
                    </label>
                    <label className="search-label">
                      Motivo
                      <input
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                        minLength={3}
                        maxLength={200}
                        disabled={disabled}
                        required
                      />
                    </label>
                    <button
                      className="button"
                      disabled={
                        disabled ||
                        tab.payments.some((payment) => !payment.voided)
                      }
                    >
                      Aplicar desconto
                    </button>
                  </form>
                  <p className="salon-hint">
                    Aplique descontos antes de registrar os pagamentos. Toda
                    alteração fica no histórico da comanda.
                  </p>
                </section>
              )}
              {actor.canReceive && (
                <section>
                  <h3>Pagamentos recebidos</h3>
                  {tab.payments.length ? (
                    <ul className="salon-payments">
                      {tab.payments.map((payment) => (
                        <li key={payment.id} data-voided={payment.voided}>
                          <div>
                            <strong>{money(payment.amountCents)}</strong>
                            <span>
                              {paymentLabels[payment.method]}
                              {payment.payer ? ` · ${payment.payer}` : ""}
                              {payment.voided ? " · Registro anulado" : ""}
                            </span>
                          </div>
                          {actor.canManage && !payment.voided && (
                            <VoidPayment
                              paymentId={payment.id}
                              disabled={disabled}
                              onVoid={(reason) =>
                                mutate("voidPayment", {
                                  ...context,
                                  paymentId: payment.id,
                                  reason,
                                })
                              }
                            />
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>Nenhum pagamento registrado.</p>
                  )}
                  {tab.remainingCents > 0 && (
                    <>
                      <div className="salon-split">
                        <label className="search-label">
                          Dividir o saldo por
                          <input
                            type="number"
                            min={2}
                            max={20}
                            value={parts}
                            onChange={(event) =>
                              setParts(Number(event.target.value))
                            }
                          />
                        </label>
                        <button
                          className="button"
                          type="button"
                          disabled={
                            disabled ||
                            !Number.isInteger(parts) ||
                            parts < 2 ||
                            parts > 20 ||
                            tab.remainingCents < parts
                          }
                          onClick={() => {
                            const share = Math.floor(
                              tab.remainingCents / parts,
                            );
                            setSuggestions(
                              Array.from(
                                { length: parts },
                                (_, index) =>
                                  share +
                                  (index === parts - 1
                                    ? tab.remainingCents - share * parts
                                    : 0),
                              ),
                            );
                          }}
                        >
                          Calcular divisão
                        </button>
                      </div>
                      {!!suggestions.length && (
                        <div
                          className="salon-suggestions"
                          aria-label="Sugestão de divisão do saldo"
                        >
                          {suggestions.map((value, index) => (
                            <button
                              type="button"
                              className="button"
                              key={index}
                              disabled={disabled || value > tab.remainingCents}
                              onClick={() => {
                                setAmount((value / 100).toFixed(2));
                                setConfirmed(false);
                              }}
                            >
                              Pessoa {index + 1}: {money(value)}
                            </button>
                          ))}
                        </div>
                      )}
                      <form className="salon-payment-form" onSubmit={pay}>
                        <label className="search-label">
                          Valor recebido (R$)
                          <input
                            inputMode="decimal"
                            placeholder="0,00"
                            value={amount}
                            onChange={(event) => {
                              setAmount(event.target.value);
                              setConfirmed(false);
                            }}
                            disabled={disabled}
                            required
                          />
                        </label>
                        <label className="search-label">
                          Forma de pagamento
                          <select
                            value={method}
                            onChange={(event) => {
                              setMethod(event.target.value);
                              setConfirmed(false);
                            }}
                            disabled={disabled}
                          >
                            <option value="pix">Pix</option>
                            <option value="card">Cartão</option>
                            <option value="cash">Dinheiro</option>
                          </select>
                        </label>
                        <label className="search-label">
                          Pessoa ou divisão (opcional)
                          <input
                            value={payer}
                            maxLength={80}
                            onChange={(event) => setPayer(event.target.value)}
                            disabled={disabled}
                          />
                        </label>
                        <label className="salon-confirm">
                          <input
                            type="checkbox"
                            checked={confirmed}
                            onChange={(event) =>
                              setConfirmed(event.target.checked)
                            }
                            disabled={disabled}
                            required
                          />
                          Conferi e este pagamento já foi recebido.
                        </label>
                        <p className="salon-hint">
                          Este registro é manual e não faz cobrança ou
                          confirmação bancária automática.
                        </p>
                        <button
                          className="button primary"
                          disabled={
                            disabled ||
                            !confirmed ||
                            !Number.isInteger(parseMoney(amount)) ||
                            parseMoney(amount) < 1 ||
                            parseMoney(amount) > tab.remainingCents
                          }
                        >
                          Registrar pagamento recebido
                        </button>
                      </form>
                    </>
                  )}
                  <div className="salon-close">
                    <p>
                      {tab.remainingCents === 0
                        ? "Total quitado. Ao encerrar, a mesa ficará aguardando limpeza."
                        : `Faltam ${money(tab.remainingCents)} para encerrar esta conta.`}
                    </p>
                    <button
                      className="button primary"
                      type="button"
                      disabled={disabled || tab.remainingCents !== 0}
                      onClick={() => void mutate("close", context)}
                    >
                      Encerrar conta quitada
                    </button>
                  </div>
                </section>
              )}
              {!actor.canReceive && (
                <p>
                  Seu acesso não permite registrar pagamentos. O proprietário
                  pode liberar essa permissão para o caixa.
                </p>
              )}
            </>
          )}
          {table.status === "awaiting_cleaning" && (
            <section>
              <h3>Conta encerrada</h3>
              <p>
                O pagamento foi registrado. A mesa só volta a ficar disponível
                depois da confirmação da limpeza.
              </p>
              {actor.canClean && (
                <button
                  className="button primary"
                  type="button"
                  disabled={disabled}
                  onClick={() => void mutate("clean", context)}
                >
                  Confirmar mesa limpa e disponível
                </button>
              )}
            </section>
          )}
        </>
      )}
    </article>
  );
}
function VoidPayment({
  paymentId,
  disabled,
  onVoid,
}: {
  paymentId: string;
  disabled: boolean;
  onVoid: (reason: string) => Promise<boolean>;
}) {
  const [editing, setEditing] = useState(false),
    [reason, setReason] = useState("");
  return editing ? (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void onVoid(reason).then((ok) => {
          if (ok) setEditing(false);
        });
      }}
    >
      <label className="search-label" htmlFor={`void-${paymentId}`}>
        Motivo da anulação
        <input
          id={`void-${paymentId}`}
          value={reason}
          minLength={3}
          maxLength={200}
          required
          onChange={(event) => setReason(event.target.value)}
        />
      </label>
      <button className="button" disabled={disabled}>
        Anular registro
      </button>
      <button
        className="salon-text-button"
        type="button"
        onClick={() => setEditing(false)}
      >
        Voltar
      </button>
    </form>
  ) : (
    <button
      className="salon-text-button"
      type="button"
      disabled={disabled}
      onClick={() => setEditing(true)}
    >
      Corrigir registro
    </button>
  );
}
