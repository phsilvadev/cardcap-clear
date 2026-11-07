"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useCustomer } from "@/lib/customer/use-customer";
import { addressText } from "@/lib/customer/types";
import { CatalogHeader, CatalogFooter } from "./catalog-shared";
import { useStoreCart, cartSelections } from "@/lib/checkout/cart";
import {
  checkoutCall,
  checkoutPix,
  checkoutError,
} from "@/lib/checkout/service";
import { getPublicStoreSummary } from "@/lib/storefront/service";
import { formatMoney, type PublicStore } from "@/lib/storefront/types";
import type {
  CheckoutDraft,
  Quote,
  CheckoutReceipt,
} from "@/lib/checkout/types";
type Step = "carrinho" | "checkout" | "pagamento" | "pedido-confirmado";
type SavedReceipt = { requestId: string; receipt: CheckoutReceipt };
type Pending = { requestId: string; payload: Record<string, unknown> };
const emptyDraft: CheckoutDraft = {
  name: "",
  phone: "",
  address: "",
  cpf: "",
  notes: "",
  fulfillment: "delivery",
};
const titles = {
  carrinho: "Seu carrinho",
  checkout: "Entrega ou retirada",
  pagamento: "Pagamento",
  "pedido-confirmado": "Acompanhe seu pedido",
};
export default function Commerce({
  step,
  storeSlug,
}: {
  step: Step;
  storeSlug: string;
}) {
  const slug = storeSlug;
  const [store, setStore] = useState<PublicStore | null>(null),
    [draft, setDraft] = useState<CheckoutDraft>(emptyDraft),
    [payment, setPayment] = useState<"pix" | "cash" | "card">("cash"),
    [quote, setQuote] = useState<Quote | null>(null),
    [error, setError] = useState(""),
    [quoteError, setQuoteError] = useState(""),
    [busy, setBusy] = useState(false),
    [saved, setSaved] = useState<SavedReceipt | null>(null),
    [pending, setPending] = useState<Pending | null>(null),
    [qr, setQr] = useState<{
      encodedImage: string;
      payload: string;
      expirationDate: string;
    } | null>(null),
    [sandbox, setSandbox] = useState(false),
    [message, setMessage] = useState("");
  const cart = useStoreCart(slug);
  const customerAccount = useCustomer();
  const draftTouched = useRef(false);
  const url = (next: Step) => `/${next}?store=${encodeURIComponent(slug)}`;
  useEffect(() => {
    const value = slug;
    let active = true;
    setStore(null);
    setDraft(emptyDraft);
    setSaved(null);
    setPending(null);
    setError("");
    draftTouched.current = false;
    if (!value) return;
    try {
      const valueDraft = JSON.parse(
        sessionStorage.getItem(`cardap-checkout:${value}`) ?? "null",
      );
      if (
        valueDraft &&
        typeof valueDraft.name === "string" &&
        ["pickup", "delivery"].includes(valueDraft.fulfillment)
      )
        setDraft({ ...emptyDraft, ...valueDraft });
      setSaved(
        JSON.parse(sessionStorage.getItem(`cardap-order:${value}`) ?? "null"),
      );
      setPending(
        JSON.parse(
          sessionStorage.getItem(`cardap-checkout-pending:${value}`) ?? "null",
        ),
      );
    } catch {
      setError("Não foi possível recuperar este pedido no navegador.");
    }
    getPublicStoreSummary(value, false)
      .then((result) => {
        if (!active) return;
        setStore(result.store);
        setDraft((current) => ({
          ...current,
          fulfillment:
            current.fulfillment === "delivery" && !result.store.acceptsDelivery
              ? "pickup"
              : current.fulfillment === "pickup" && !result.store.acceptsPickup
                ? "delivery"
                : current.fulfillment,
        }));
      })
      .catch((reason) => {
        if (active) setError(checkoutError(reason));
      });
    return () => {
      active = false;
    };
  }, [slug, step]);
  useEffect(() => {
    const profile = customerAccount.profile;
    if (step !== "checkout" || !profile || draftTouched.current) return;
    const primary =
      profile.addresses.find((address) => address.isDefault) ??
      profile.addresses[0];
    setDraft((current) => ({
      ...current,
      name: current.name || profile.name,
      phone: current.phone || profile.phone,
      address: current.address || (primary ? addressText(primary) : ""),
    }));
  }, [customerAccount.profile, step, slug]);
  const selectionKey = JSON.stringify(cartSelections(cart.items));
  useEffect(() => {
    if (
      !slug ||
      !cart.loaded ||
      !cart.items.length ||
      step === "pedido-confirmado"
    ) {
      setQuote(null);
      return;
    }
    let active = true;
    setQuote(null);
    setQuoteError("");
    const timer = setTimeout(() => {
      checkoutCall<Quote>("quote", {
        slug,
        items: JSON.parse(selectionKey),
        fulfillment: draft.fulfillment,
      })
        .then((result) => {
          if (active) setQuote(result);
        })
        .catch((reason) => {
          if (active) setQuoteError(checkoutError(reason));
        });
    }, 200);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [slug, cart.loaded, selectionKey, draft.fulfillment, step]);
  useEffect(() => {
    if (step !== "pedido-confirmado" || !saved?.requestId || !slug) return;
    let active = true,
      locked = false;
    async function update() {
      if (locked || document.hidden) return;
      locked = true;
      try {
        const receipt = await checkoutCall<CheckoutReceipt>("status", {
          slug,
          requestId: saved!.requestId,
        });
        if (active) {
          const next = { requestId: saved!.requestId, receipt };
          setSaved(next);
          sessionStorage.setItem(`cardap-order:${slug}`, JSON.stringify(next));
          setError("");
        }
      } catch (reason) {
        if (active) setError(checkoutError(reason));
      } finally {
        locked = false;
      }
    }
    void update();
    const timer = setInterval(update, 5000);
    window.addEventListener("focus", update);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("focus", update);
    };
  }, [step, slug, saved?.requestId]);
  async function preparePix() {
    if (!saved || busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await checkoutPix(slug, saved.requestId);
      setQr(result.qr);
      setSandbox(result.environment === "sandbox");
    } catch (reason) {
      setError(checkoutError(reason));
    } finally {
      setBusy(false);
    }
  }
  function continueCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      sessionStorage.setItem(`cardap-checkout:${slug}`, JSON.stringify(draft));
      location.assign(url("pagamento"));
    } catch {
      setError("Não foi possível salvar os dados neste navegador.");
    }
  }
  async function placeOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || (!pending && (!quote || !cart.items.length))) return;
    setBusy(true);
    setError("");
    let operation = pending;
    try {
      if (!operation) {
        operation = {
          requestId: crypto.randomUUID(),
          payload: {
            slug,
            items: cartSelections(cart.items),
            fulfillment: draft.fulfillment,
            payment,
            customer: {
              name: draft.name,
              phone: draft.phone,
              address: draft.address,
              cpf: draft.cpf,
            },
            notes: draft.notes,
            pricingHash: quote!.pricingHash,
          },
        };
        sessionStorage.setItem(
          `cardap-checkout-pending:${slug}`,
          JSON.stringify(operation),
        );
        setPending(operation);
      }
      const receipt = await checkoutCall<CheckoutReceipt>("create", {
        ...operation.payload,
        requestId: operation.requestId,
      });
      const next = { requestId: operation.requestId, receipt };
      sessionStorage.setItem(`cardap-order:${slug}`, JSON.stringify(next));
      setSaved(next);
      sessionStorage.removeItem(`cardap-checkout-pending:${slug}`);
      sessionStorage.removeItem(`cardap-checkout:${slug}`);
      setPending(null);
      cart.update([]);
      location.assign(url("pedido-confirmado"));
    } catch (reason) {
      const code = (reason as { code?: string })?.code;
      if (
        [
          "functions/invalid-argument",
          "functions/failed-precondition",
          "functions/not-found",
          "functions/permission-denied",
          "functions/resource-exhausted",
        ].includes(code ?? "")
      ) {
        try {
          sessionStorage.removeItem(`cardap-checkout-pending:${slug}`);
          setPending(null);
        } catch {
          /* Preserve the pending operation if storage is unavailable. */
        }
      }
      setError(checkoutError(reason));
    } finally {
      setBusy(false);
    }
  }
  const receipt = saved?.receipt;
  const finalLines =
    step === "pedido-confirmado" ? receipt?.lines : quote?.lines;
  const total =
    step === "pedido-confirmado" ? receipt?.totalCents : quote?.totalCents;
  const pendingPix =
    receipt?.payment === "pix" && receipt.paymentStatus === "awaiting_payment";
  return (
    <div className="flow-shell">
      <CatalogHeader
        backHref={
          slug ? `/loja?store=${encodeURIComponent(slug)}` : "/restaurantes"
        }
        backLabel="Voltar à loja"
      />
      <main id="conteudo">
        <h1>{titles[step]}</h1>
        {!slug ? (
          <p>
            Escolha uma loja em <a href="/restaurantes">Restaurantes</a> para
            começar.
          </p>
        ) : (
          <>
            <p>{store?.name ?? "Sua loja"}</p>
            {step === "checkout" && (
              <p className="restaurant-login-note">
                {customerAccount.user ? (
                  <>
                    Este pedido será vinculado à sua conta.{" "}
                    <a href="/cliente">Minha conta</a>
                  </>
                ) : (
                  <>
                    Você pode comprar como visitante ou{" "}
                    <a
                      href={`/cliente/login?next=${encodeURIComponent(url("checkout"))}`}
                    >
                      entrar para acompanhar seus pedidos na sua conta
                    </a>
                    .
                  </>
                )}
              </p>
            )}
            {step === "checkout" &&
              !!customerAccount.profile?.addresses.length && (
                <label className="flow-field">
                  Usar endereço salvo
                  <select
                    defaultValue=""
                    onChange={(event) => {
                      const selected = customerAccount.profile?.addresses.find(
                        (item) => item.id === event.target.value,
                      );
                      if (selected) {
                        draftTouched.current = true;
                        setDraft((current) => ({
                          ...current,
                          address: addressText(selected),
                        }));
                      }
                    }}
                  >
                    <option value="">Selecione um endereço</option>
                    {customerAccount.profile.addresses.map((item) => (
                      <option value={item.id} key={item.id}>
                        {item.label} — {item.street}, {item.number}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            <nav className="commerce-steps" aria-label="Etapas da compra">
              <a href={url("carrinho")}>Carrinho</a>
              <a href={url("checkout")}>Entrega</a>
              <a href={url("pagamento")}>Pagamento</a>
            </nav>
            {(error || cart.error || quoteError) && (
              <p className="commerce-error" role="alert">
                {error || cart.error || quoteError}
              </p>
            )}
            {step === "carrinho" && (
              <section>
                {!cart.loaded ? (
                  <p role="status">Carregando carrinho…</p>
                ) : !cart.items.length ? (
                  <p>
                    Seu carrinho está vazio.{" "}
                    <a href={`/loja?store=${encodeURIComponent(slug)}`}>
                      Escolher produtos
                    </a>
                  </p>
                ) : (
                  cart.items.map((item) => (
                    <article className="commerce-cart-line" key={item.key}>
                      <div>
                        <h2>{item.name}</h2>
                        <p>{item.details.join(" · ")}</p>
                        <p>
                          {formatMoney(item.priceCents)} por unidade · valor
                          sujeito à confirmação
                        </p>
                      </div>
                      <label>
                        Quantidade
                        <input
                          aria-label={`Quantidade de ${item.name}`}
                          type="number"
                          min={1}
                          max={99}
                          value={item.quantity}
                          onChange={(event) =>
                            cart.update(
                              cart.items.map((entry) =>
                                entry.key === item.key
                                  ? {
                                      ...entry,
                                      quantity: Math.max(
                                        1,
                                        Math.min(
                                          99,
                                          Number(event.target.value),
                                        ),
                                      ),
                                    }
                                  : entry,
                              ),
                            )
                          }
                        />
                      </label>
                      <button
                        className="flow-button secondary"
                        onClick={() =>
                          cart.update(
                            cart.items.filter(
                              (entry) => entry.key !== item.key,
                            ),
                          )
                        }
                      >
                        Remover
                      </button>
                    </article>
                  ))
                )}
                {!!cart.items.length && (
                  <a className="flow-button" href={url("checkout")}>
                    Continuar para entrega
                  </a>
                )}
              </section>
            )}
            {step === "checkout" && (
              <form
                className="commerce-form"
                onSubmit={continueCheckout}
                onChangeCapture={() => {
                  draftTouched.current = true;
                }}
              >
                <label>
                  Nome
                  <input
                    name="name"
                    required
                    minLength={2}
                    maxLength={120}
                    autoComplete="name"
                    value={draft.name}
                    onChange={(event) =>
                      setDraft({ ...draft, name: event.target.value })
                    }
                  />
                </label>
                <label>
                  Telefone com DDD
                  <input
                    name="phone"
                    required
                    type="tel"
                    minLength={10}
                    maxLength={20}
                    autoComplete="tel"
                    value={draft.phone}
                    onChange={(event) =>
                      setDraft({ ...draft, phone: event.target.value })
                    }
                  />
                </label>
                <label>
                  Como deseja receber?
                  <select
                    value={draft.fulfillment}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        fulfillment: event.target
                          .value as CheckoutDraft["fulfillment"],
                      })
                    }
                  >
                    {store?.acceptsDelivery && (
                      <option value="delivery">Entrega</option>
                    )}
                    {store?.acceptsPickup && (
                      <option value="pickup">Retirada na loja</option>
                    )}
                  </select>
                </label>
                {draft.fulfillment === "delivery" && (
                  <label>
                    Endereço completo
                    <input
                      name="address"
                      required
                      minLength={5}
                      maxLength={500}
                      autoComplete="street-address"
                      value={draft.address}
                      onChange={(event) =>
                        setDraft({ ...draft, address: event.target.value })
                      }
                    />
                  </label>
                )}
                <label>
                  Observações
                  <textarea
                    maxLength={500}
                    value={draft.notes}
                    onChange={(event) =>
                      setDraft({ ...draft, notes: event.target.value })
                    }
                  />
                </label>
                <button
                  className="flow-button"
                  disabled={
                    !cart.items.length || !quote || !store?.receivingOrders
                  }
                >
                  Continuar para pagamento
                </button>
              </form>
            )}
            {step === "pagamento" &&
              (pendingPix ? (
                <p>
                  Você já tem um Pix aguardando confirmação.{" "}
                  <a className="flow-button" href={url("pedido-confirmado")}>
                    Retomar pagamento
                  </a>
                </p>
              ) : (
                <form className="commerce-form" onSubmit={placeOrder}>
                  {pending && (
                    <p role="status">
                      Um envio precisa de confirmação. O botão repetirá
                      exatamente o mesmo pedido para evitar duplicação.
                    </p>
                  )}
                  <fieldset disabled={busy || !!pending}>
                    <legend>Forma de pagamento</legend>
                    <label className="commerce-option">
                      <input
                        type="radio"
                        name="payment"
                        value="pix"
                        checked={payment === "pix"}
                        disabled={!quote?.pixEnabled}
                        onChange={() => setPayment("pix")}
                      />
                      Pix online
                      {!quote?.pixEnabled ? " — indisponível no momento" : ""}
                    </label>
                    <label className="commerce-option">
                      <input
                        type="radio"
                        name="payment"
                        value="card"
                        checked={payment === "card"}
                        onChange={() => setPayment("card")}
                      />
                      Cartão na entrega ou retirada
                    </label>
                    <label className="commerce-option">
                      <input
                        type="radio"
                        name="payment"
                        value="cash"
                        checked={payment === "cash"}
                        onChange={() => setPayment("cash")}
                      />
                      Dinheiro na entrega ou retirada
                    </label>
                    {payment === "pix" && (
                      <label>
                        CPF do pagador
                        <input
                          name="cpf"
                          required
                          maxLength={14}
                          inputMode="numeric"
                          value={draft.cpf}
                          onChange={(event) =>
                            setDraft({ ...draft, cpf: event.target.value })
                          }
                        />
                      </label>
                    )}
                  </fieldset>
                  <p>
                    Confira os valores abaixo. Pagamentos presenciais ficam a
                    pagar. O Pix só será confirmado pelo sistema após o
                    recebimento.
                  </p>
                  <button
                    className="flow-button"
                    disabled={
                      busy ||
                      (!pending &&
                        (!quote || !cart.items.length || draft.name.length < 2))
                    }
                  >
                    {busy
                      ? "Confirmando…"
                      : pending
                        ? "Conferir o mesmo envio"
                        : "Confirmar pedido"}
                  </button>
                </form>
              ))}
            {step === "pedido-confirmado" &&
              (!receipt ? (
                <p>Nenhum pedido encontrado neste navegador.</p>
              ) : (
                <section>
                  <h2>
                    {receipt.orderId
                      ? "Pedido enviado à loja"
                      : pendingPix
                        ? "Aguardando pagamento Pix"
                        : "Pagamento precisa de conferência"}
                  </h2>
                  <p>Número: {receipt.orderId ?? receipt.id}</p>
                  <p>
                    {receipt.paymentStatus === "paid"
                      ? "Pagamento recebido e confirmado pelo sistema."
                      : receipt.paymentStatus === "due_on_fulfillment"
                        ? "Pagamento pendente: pague na entrega ou retirada."
                        : receipt.paymentStatus === "expired"
                          ? "O Pix expirou ou foi cancelado. Nenhum pedido foi enviado à loja."
                          : receipt.paymentStatus === "refunded"
                            ? "Pagamento estornado ou em análise de estorno. Entre em contato com a loja."
                            : "O pedido será enviado à loja depois que o sistema confirmar o pagamento."}
                  </p>
                  {pendingPix && (
                    <>
                      <button
                        className="flow-button"
                        disabled={busy}
                        onClick={preparePix}
                      >
                        {busy
                          ? "Preparando Pix…"
                          : qr
                            ? "Conferir Pix novamente"
                            : "Gerar ou consultar Pix"}
                      </button>
                      {sandbox && (
                        <p role="status">
                          Ambiente de testes Asaas. Não utilize este Pix para
                          uma compra real.
                        </p>
                      )}
                      {qr && (
                        <div className="commerce-pix">
                          <img
                            src={`data:image/png;base64,${qr.encodedImage}`}
                            alt="QR Code do pagamento Pix"
                          />
                          <label>
                            Código Pix copia e cola
                            <textarea readOnly value={qr.payload} />
                          </label>
                          <button
                            className="flow-button secondary"
                            onClick={() =>
                              void navigator.clipboard
                                .writeText(qr.payload)
                                .then(() => setMessage("Código Pix copiado."))
                                .catch(() =>
                                  setMessage(
                                    "Selecione o código acima para copiar.",
                                  ),
                                )
                            }
                          >
                            Copiar código Pix
                          </button>
                          <p>Validade: {qr.expirationDate}</p>
                          <p role="status">{message}</p>
                        </div>
                      )}
                    </>
                  )}
                </section>
              ))}
            {finalLines && (
              <aside className="commerce-summary">
                <h2>Resumo do pedido</h2>
                {finalLines.map((line, index) => (
                  <div key={index}>
                    <span>
                      {line.quantity} × {line.name}
                      {line.details.length
                        ? ` · ${line.details.join(", ")}`
                        : ""}
                    </span>
                    <strong>{formatMoney(line.totalCents)}</strong>
                  </div>
                ))}
                <div>
                  <span>Entrega</span>
                  <strong>
                    {formatMoney(
                      step === "pedido-confirmado"
                        ? (receipt?.shippingCents ?? 0)
                        : (quote?.shippingCents ?? 0),
                    )}
                  </strong>
                </div>
                <div>
                  <span>Total</span>
                  <strong>{formatMoney(total ?? 0)}</strong>
                </div>
              </aside>
            )}
          </>
        )}
      </main>
      <CatalogFooter />
    </div>
  );
}
