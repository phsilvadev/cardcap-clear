"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import BrandLogo from "@/components/brand-logo";
import { useCustomer } from "@/lib/customer/use-customer";
import {
  customerCall,
  customerError,
  logoutCustomer,
  resetCustomerPassword,
  verifyCustomerEmail,
} from "@/lib/customer/service";
import {
  addressText,
  orderLabels,
  paymentLabels,
  type CustomerProfile,
  type CustomerAddress,
  type CustomerOrder,
  type OrderCursor,
} from "@/lib/customer/types";
import { getCustomerAuth } from "@/lib/firebase/client";
import { readCart } from "@/lib/checkout/cart";
import { formatMoney } from "@/lib/storefront/types";
import "../_styles/customer-area.css";

const tabs = [
  ["orders", "Meus pedidos"],
  ["profile", "Meu perfil"],
  ["addresses", "Endereços"],
  ["favorites", "Favoritos"],
  ["carts", "Meus carrinhos"],
] as const;
type Tab = (typeof tabs)[number][0];
const emptyAddress: CustomerAddress = {
  id: "",
  label: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  zip: "",
  isDefault: false,
};
type CartSummary = { slug: string; count: number; total: number };

export default function CustomerAccount() {
  const router = useRouter(),
    account = useCustomer();
  const [tab, setTab] = useState<Tab>("orders"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const [orders, setOrders] = useState<CustomerOrder[]>([]),
    [cursor, setCursor] = useState<OrderCursor>(null),
    [ordersReady, setOrdersReady] = useState(false),
    [ordersBusy, setOrdersBusy] = useState(false);
  const [selected, setSelected] = useState<string | null>(null),
    [address, setAddress] = useState<CustomerAddress>(emptyAddress),
    [carts, setCarts] = useState<CartSummary[]>([]);
  const orderVersion = useRef(0),
    addressForm = useRef<HTMLFormElement>(null);
  const uid = account.user?.uid;
  const profile = account.profile;
  useEffect(() => {
    if (account.ready && !account.user && !account.error)
      router.replace("/cliente/login");
  }, [account.ready, account.user, account.error, router]);
  const fetchOrders = useCallback(
    async (page: OrderCursor = null) => {
      if (!uid) return;
      const version = ++orderVersion.current;
      setOrdersBusy(true);
      try {
        const result = await customerCall<{
          orders: CustomerOrder[];
          cursor: OrderCursor;
        }>("orders", { cursor: page });
        if (
          version !== orderVersion.current ||
          getCustomerAuth().currentUser?.uid !== uid
        )
          return;
        setOrders((previous) =>
          page
            ? [
                ...previous,
                ...result.orders.filter(
                  (item) => !previous.some((old) => old.id === item.id),
                ),
              ]
            : result.orders,
        );
        setCursor(result.cursor);
        setOrdersReady(true);
        setError("");
      } catch (reason) {
        if (version === orderVersion.current) setError(customerError(reason));
      } finally {
        if (version === orderVersion.current) setOrdersBusy(false);
      }
    },
    [uid],
  );
  useEffect(() => {
    orderVersion.current++;
    setOrders([]);
    setOrdersReady(false);
    setCursor(null);
    setSelected(null);
    if (uid) void fetchOrders();
    return () => {
      orderVersion.current++;
    };
  }, [uid, fetchOrders]);
  useEffect(() => {
    if (tab !== "orders" || !uid) return;
    const refresh = () => {
      if (!document.hidden) void fetchOrders();
    };
    const timer = window.setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [tab, uid, fetchOrders]);
  useEffect(() => {
    const update = () => {
      const list: CartSummary[] = [];
      try {
        for (let index = 0; index < localStorage.length; index++) {
          const key = localStorage.key(index);
          if (!key?.startsWith("cardap-cart:v1:")) continue;
          const slug = key.slice("cardap-cart:v1:".length);
          if (!/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(slug)) continue;
          try {
            const items = readCart(slug);
            if (items.length)
              list.push({
                slug,
                count: items.reduce((sum, item) => sum + item.quantity, 0),
                total: items.reduce(
                  (sum, item) => sum + item.quantity * item.priceCents,
                  0,
                ),
              });
          } catch {
            /* Skip a damaged cart without blocking the other stores. */
          }
        }
        setCarts(list);
      } catch {
        setError("Não foi possível ler os carrinhos deste navegador.");
      }
    };
    update();
    window.addEventListener("storage", update);
    window.addEventListener("cardap:cart", update);
    return () => {
      window.removeEventListener("storage", update);
      window.removeEventListener("cardap:cart", update);
    };
  }, []);
  async function run(operation: () => Promise<unknown>, success: string) {
    if (busy) return false;
    const actor = getCustomerAuth().currentUser?.uid;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await operation();
      if (getCustomerAuth().currentUser?.uid !== actor) return false;
      setMessage(success);
      return true;
    } catch (reason) {
      if (getCustomerAuth().currentUser?.uid === actor)
        setError(customerError(reason));
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function mutate(action: string, values: Record<string, unknown>) {
    const result = await customerCall<CustomerProfile>(action, values);
    if (result.uid === getCustomerAuth().currentUser?.uid)
      account.setProfile(result);
  }
  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await run(
      () =>
        mutate("saveProfile", {
          name: data.get("name"),
          phone: data.get("phone"),
        }),
      "Perfil salvo.",
    );
  }
  async function saveAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (await run(() => mutate("saveAddress", { address }), "Endereço salvo."))
      setAddress(emptyAddress);
  }
  async function exit() {
    await run(logoutCustomer, "");
  }
  const content =
    !account.ready || !account.user ? (
      <section className="customer-panel">
        <h1>Minha conta</h1>
        {account.error ? (
          <p className="customer-error" role="alert">
            {account.error}
          </p>
        ) : (
          <p role="status">Verificando seu acesso…</p>
        )}
        <a className="customer-text-link" href="/cliente/login">
          Ir para o login
        </a>
      </section>
    ) : !profile ? (
      <section className="customer-panel">
        <h1>Minha conta</h1>
        <p role="status">{account.error || "Carregando seu perfil…"}</p>
        <button
          className="customer-button"
          onClick={() => void account.refresh()}
        >
          Tentar novamente
        </button>
        <button className="customer-button" onClick={exit} disabled={busy}>
          Sair da conta
        </button>
      </section>
    ) : (
      <>
        <div className="customer-account-heading">
          <div>
            <p className="customer-eyebrow">Sua área no Cardap</p>
            <h1>Olá, {profile.name.split(" ")[0] || "boas-vindas"}.</h1>
            <p>Seus pedidos, seus endereços e seus sabores favoritos.</p>
          </div>
          <a className="customer-button customer-primary" href="/#buscar">
            Encontrar restaurantes →
          </a>
        </div>
        {!profile.emailVerified && (
          <div className="customer-notice">
            <p>Confirme seu e-mail para manter sua conta atualizada.</p>
            <button
              disabled={busy}
              onClick={() =>
                void run(
                  verifyCustomerEmail,
                  "E-mail de confirmação enviado. Confira sua caixa de entrada.",
                )
              }
            >
              Enviar confirmação
            </button>
            <button
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  await account.user?.reload();
                  await account.refresh();
                }, "Verificação atualizada.")
              }
            >
              Já confirmei
            </button>
          </div>
        )}
        <div className="customer-account-layout">
          <aside className="customer-sidebar">
            <strong>{profile.name || "Minha conta"}</strong>
            <p>{profile.email}</p>
            <nav aria-label="Minha conta">
              {tabs.map(([key, label]) => (
                <button
                  key={key}
                  aria-current={tab === key ? "page" : undefined}
                  onClick={() => {
                    setTab(key);
                    setError("");
                    setMessage("");
                  }}
                >
                  {label}
                </button>
              ))}
            </nav>
            <button className="customer-button" onClick={exit} disabled={busy}>
              Sair da conta
            </button>
          </aside>
          <div className="customer-account-content">
            {error && (
              <p className="customer-error" role="alert">
                {error}
              </p>
            )}
            {message && (
              <p className="customer-success" role="status">
                {message}
              </p>
            )}
            {tab === "orders" && (
              <section className="customer-panel">
                <div className="customer-section-heading">
                  <h2>Meus pedidos</h2>
                  <button
                    className="customer-button"
                    disabled={ordersBusy}
                    onClick={() => void fetchOrders()}
                  >
                    {ordersBusy ? "Atualizando…" : "Atualizar"}
                  </button>
                </div>
                <p className="customer-muted">
                  Pedidos feitos enquanto você está conectado aparecem aqui. O
                  andamento é atualizado automaticamente.
                </p>
                {!ordersReady && !error && (
                  <p role="status">Carregando pedidos…</p>
                )}
                {ordersReady && !orders.length && (
                  <div className="customer-empty">
                    <h3>Seu próximo pedido começa aqui.</h3>
                    <p>
                      Explore os restaurantes da sua região e escolha o que vai
                      comer.
                    </p>
                    <a
                      className="customer-button customer-primary"
                      href="/#buscar"
                    >
                      Encontrar restaurantes
                    </a>
                  </div>
                )}
                <div className="customer-list">
                  {orders.map((order) => (
                    <article className="customer-order" key={order.id}>
                      <div className="customer-section-heading">
                        <div>
                          <h3>{order.storeName}</h3>
                          <p>
                            {new Date(order.createdAtMs).toLocaleString(
                              "pt-BR",
                              { timeZone: "America/Sao_Paulo" },
                            )}
                          </p>
                        </div>
                        <span className="customer-badge">
                          {orderLabels[order.status] || order.status}
                        </span>
                      </div>
                      <p>
                        {order.lines
                          .map((line) => `${line.quantity} × ${line.name}`)
                          .join(" · ")}
                      </p>
                      <div className="customer-section-heading">
                        <strong>{formatMoney(order.totalCents)}</strong>
                        <button
                          className="customer-text-link"
                          aria-expanded={selected === order.id}
                          aria-controls={`order-${order.id}`}
                          onClick={() =>
                            setSelected(selected === order.id ? null : order.id)
                          }
                        >
                          {selected === order.id
                            ? "Fechar detalhes"
                            : "Ver detalhes"}
                        </button>
                      </div>
                      {selected === order.id && (
                        <div
                          id={`order-${order.id}`}
                          className="customer-order-detail"
                        >
                          <p className="customer-muted">
                            Pedido #{order.id.slice(-8).toUpperCase()}
                          </p>
                          {order.lines.map((line, index) => (
                            <div key={index}>
                              <p>
                                <strong>
                                  {line.quantity} × {line.name}
                                </strong>{" "}
                                — {formatMoney(line.totalCents)}
                              </p>
                              {line.details?.length > 0 && (
                                <p>{line.details.join(", ")}</p>
                              )}
                            </div>
                          ))}
                          <p>Entrega: {formatMoney(order.shippingCents)}</p>
                          <p>
                            {order.fulfillment === "pickup"
                              ? "Retirada no restaurante"
                              : order.address}
                          </p>
                          <p>
                            Pagamento:{" "}
                            {order.payment === "cash"
                              ? "Dinheiro"
                              : order.payment === "card"
                                ? "Cartão na entrega / retirada"
                                : "Pix"}{" "}
                            ·{" "}
                            {paymentLabels[order.paymentStatus] ||
                              order.paymentStatus}
                          </p>
                          {order.notes && <p>Observações: {order.notes}</p>}
                          {order.cancellationReason && (
                            <p className="customer-error">
                              Motivo do cancelamento: {order.cancellationReason}
                            </p>
                          )}
                          <a
                            className="customer-text-link"
                            href={`/loja?store=${encodeURIComponent(order.slug)}`}
                          >
                            Ver restaurante →
                          </a>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
                {cursor && (
                  <button
                    className="customer-button"
                    disabled={ordersBusy}
                    onClick={() => void fetchOrders(cursor)}
                  >
                    Carregar mais pedidos
                  </button>
                )}
              </section>
            )}
            {tab === "profile" && (
              <section className="customer-panel">
                <h2>Meu perfil</h2>
                <form
                  className="customer-form"
                  onSubmit={saveProfile}
                  key={profile.uid}
                >
                  <label>
                    Seu nome
                    <input
                      name="name"
                      defaultValue={profile.name}
                      minLength={2}
                      maxLength={100}
                      autoComplete="name"
                      required
                    />
                  </label>
                  <label>
                    E-mail
                    <input
                      type="email"
                      value={profile.email}
                      readOnly
                      aria-describedby="customer-email-note"
                    />
                  </label>
                  <p id="customer-email-note" className="customer-muted">
                    Este é o e-mail usado para entrar na sua conta.
                  </p>
                  <label>
                    Telefone com DDD
                    <input
                      name="phone"
                      type="tel"
                      defaultValue={profile.phone}
                      maxLength={20}
                      autoComplete="tel"
                    />
                  </label>
                  <button
                    className="customer-button customer-primary"
                    disabled={busy}
                  >
                    Salvar perfil
                  </button>
                </form>
                <button
                  className="customer-text-link"
                  disabled={busy}
                  onClick={() =>
                    void run(
                      () => resetCustomerPassword(profile.email),
                      "Enviamos as instruções para alterar sua senha ao seu e-mail.",
                    )
                  }
                >
                  Alterar minha senha por e-mail
                </button>
              </section>
            )}
            {tab === "addresses" && (
              <section className="customer-panel">
                <h2>Meus endereços</h2>
                <p className="customer-muted">
                  Salve até 5 endereços e escolha um como principal.
                </p>
                <div className="customer-list">
                  {profile.addresses.map((item) => (
                    <article className="customer-address" key={item.id}>
                      <h3>
                        {item.label}{" "}
                        {item.isDefault && (
                          <span className="customer-badge">Principal</span>
                        )}
                      </h3>
                      <p>{addressText(item)}</p>
                      <div className="customer-inline-actions">
                        <button
                          className="customer-text-link"
                          disabled={busy}
                          onClick={() => {
                            setAddress(item);
                            addressForm.current?.scrollIntoView({
                              block: "center",
                              behavior: "smooth",
                            });
                          }}
                        >
                          Editar
                        </button>
                        {!item.isDefault && (
                          <button
                            className="customer-text-link"
                            disabled={busy}
                            onClick={() =>
                              void run(
                                () =>
                                  mutate("saveAddress", {
                                    address: { ...item, isDefault: true },
                                  }),
                                "Endereço principal atualizado.",
                              )
                            }
                          >
                            Usar como principal
                          </button>
                        )}
                        <button
                          className="customer-text-link"
                          disabled={busy}
                          onClick={() => {
                            if (
                              window.confirm(
                                `Excluir o endereço “${item.label}”?`,
                              )
                            )
                              void run(
                                () => mutate("deleteAddress", { id: item.id }),
                                "Endereço excluído.",
                              );
                          }}
                        >
                          Excluir
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
                <h3>{address.id ? "Editar endereço" : "Adicionar endereço"}</h3>
                <form
                  ref={addressForm}
                  className="customer-form customer-address-form"
                  onSubmit={saveAddress}
                >
                  {(
                    [
                      ["label", "Nome do endereço", "Casa, trabalho…", 40],
                      ["street", "Rua", "", 120],
                      ["number", "Número", "", 20],
                      ["complement", "Complemento", "Opcional", 100],
                      ["neighborhood", "Bairro", "", 80],
                      ["city", "Cidade", "", 80],
                      ["state", "Estado (UF)", "SP", 2],
                      ["zip", "CEP", "00000-000", 9],
                    ] as const
                  ).map(([key, label, placeholder, max]) => (
                    <label key={key}>
                      {label}
                      <input
                        name={key}
                        value={address[key]}
                        onChange={(event) =>
                          setAddress({ ...address, [key]: event.target.value })
                        }
                        placeholder={placeholder}
                        maxLength={max}
                        required={key !== "complement"}
                        autoComplete={
                          key === "zip"
                            ? "postal-code"
                            : key === "city"
                              ? "address-level2"
                              : key === "state"
                                ? "address-level1"
                                : "off"
                        }
                      />
                    </label>
                  ))}
                  <label className="customer-checkbox">
                    <input
                      type="checkbox"
                      checked={address.isDefault}
                      onChange={(event) =>
                        setAddress({
                          ...address,
                          isDefault: event.target.checked,
                        })
                      }
                    />
                    Usar como endereço principal
                  </label>
                  <div className="customer-inline-actions">
                    <button
                      className="customer-button customer-primary"
                      disabled={
                        busy || (!address.id && profile.addresses.length >= 5)
                      }
                    >
                      Salvar endereço
                    </button>
                    {address.id && (
                      <button
                        type="button"
                        className="customer-button"
                        onClick={() => setAddress(emptyAddress)}
                      >
                        Cancelar edição
                      </button>
                    )}
                  </div>
                </form>
              </section>
            )}
            {tab === "favorites" && (
              <section className="customer-panel">
                <h2>Restaurantes favoritos</h2>
                {!profile.favorites.length && (
                  <div className="customer-empty">
                    <p>
                      Você ainda não salvou restaurantes. Marque seus favoritos
                      ao visitar os cardápios.
                    </p>
                    <a
                      className="customer-button customer-primary"
                      href="/#buscar"
                    >
                      Explorar restaurantes
                    </a>
                  </div>
                )}
                <div className="customer-list">
                  {profile.favorites.map((favorite) => (
                    <article
                      className="customer-section-heading customer-address"
                      key={favorite.slug}
                    >
                      <a
                        href={`/loja?store=${encodeURIComponent(favorite.slug)}`}
                      >
                        <h3>{favorite.name}</h3>
                        <span className="customer-text-link">
                          Ver cardápio →
                        </span>
                      </a>
                      <button
                        className="customer-text-link"
                        disabled={busy}
                        onClick={() =>
                          void run(
                            () =>
                              mutate("favorite", {
                                slug: favorite.slug,
                                remove: true,
                              }),
                            "Restaurante removido dos favoritos.",
                          )
                        }
                      >
                        Remover
                      </button>
                    </article>
                  ))}
                </div>
              </section>
            )}
            {tab === "carts" && (
              <section className="customer-panel">
                <h2>Meus carrinhos</h2>
                <p className="customer-muted">
                  Os carrinhos ficam salvos neste navegador. Os preços são
                  confirmados ao finalizar a compra.
                </p>
                {!carts.length && (
                  <div className="customer-empty">
                    <p>Seu carrinho está esperando seu próximo sabor.</p>
                    <a
                      className="customer-button customer-primary"
                      href="/#buscar"
                    >
                      Encontrar restaurantes
                    </a>
                  </div>
                )}
                <div className="customer-list">
                  {carts.map((cart) => (
                    <article className="customer-address" key={cart.slug}>
                      <h3>{cart.slug.replace(/-/g, " ")}</h3>
                      <p>
                        {cart.count} itens · estimativa de{" "}
                        {formatMoney(cart.total)}
                      </p>
                      <a
                        className="customer-text-link"
                        href={`/carrinho?store=${encodeURIComponent(cart.slug)}`}
                      >
                        Continuar pedido →
                      </a>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </>
    );
  return (
    <div className="customer-shell">
      <header className="customer-header">
        <a href="/" aria-label="Cardap — início">
          <BrandLogo />
        </a>
        <a href="/#buscar">Encontrar restaurantes</a>
      </header>
      <main className="customer-account-main">{content}</main>
      <footer className="customer-footer">
        Cardap · Sua próxima refeição começa aqui.
      </footer>
    </div>
  );
}
