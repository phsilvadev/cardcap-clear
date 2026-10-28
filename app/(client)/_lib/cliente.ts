import type { CartItem, Customer, DemoOrder } from "@/lib/types";
import { query } from "@/lib/dom";
export default function initialize() {
  const controller = new AbortController();
  const listenWindow = (type: keyof WindowEventMap, handler: EventListener) =>
    window.addEventListener(type, handler, { signal: controller.signal });
  (() => {
    const stores = [
      "Quintal da Mesa",
      "Ponto do Burger",
      "Forno & Massa",
      "Café da Esquina",
      "Doce Encontro",
      "Tempero de Casa",
    ];
    const userKey = "cardap-demo-user";
    const read = <T>(storage: Storage, key: string, fallback: T): T => {
      try {
        return (JSON.parse(storage.getItem(key) ?? "null") as T) ?? fallback;
      } catch {
        return fallback;
      }
    };
    const money = (cents: number) =>
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(cents / 100);
    const validItems = (items: unknown): CartItem[] =>
      Array.isArray(items)
        ? items.filter(
            (item) =>
              item &&
              typeof item.name === "string" &&
              Number.isInteger(item.quantity) &&
              item.quantity > 0 &&
              item.quantity <= 99 &&
              Number.isFinite(item.price) &&
              item.price > 0 &&
              item.price < 100000,
          )
        : [];
    const createEntry = (
      title: string,
      description: string,
      label: string,
      href: string,
    ) => {
      const article = document.createElement("article");
      article.className = "account-entry";
      const heading = document.createElement("h3");
      heading.textContent = title;
      const text = document.createElement("p");
      text.textContent = description;
      const link = document.createElement("a");
      link.href = href;
      link.textContent = label;
      article.append(heading, text, link);
      return article;
    };
    const getUser = () => {
      const user = read<Customer | null>(sessionStorage, userKey, null);
      return user?.id === "demo-customer" &&
        user?.demo === true &&
        typeof user.name === "string" &&
        typeof user.email === "string"
        ? user
        : null;
    };
    const render = () => {
      const user = getUser();
      query<HTMLElement>("#guest").hidden = !!user;
      query<HTMLElement>("#account").hidden = !user;
      query<HTMLElement>("#welcome").textContent = user
        ? "Olá, " + user.name + "."
        : "Sua área no Cardap";
      if (!user) return;
      query<HTMLElement>("#account-name").textContent = user.name;
      query<HTMLElement>("#account-email").textContent = user.email;
      query<HTMLInputElement>("#profile-name").value = user.name;
      query<HTMLInputElement>("#profile-email").value = user.email;
      const carts = query<HTMLElement>("#cart-list");
      const orders = query<HTMLElement>("#order-list");
      carts.replaceChildren();
      orders.replaceChildren();
      let itemCount = 0;
      let orderCount = 0;
      stores.forEach((store) => {
        const encoded = encodeURIComponent(store);
        const params = new URLSearchParams({ store });
        const cart = validItems(
          read(localStorage, "cardap-demo-cart:" + encoded, []),
        );
        if (cart.length) {
          const count = cart.reduce((sum, item) => sum + item.quantity, 0);
          itemCount += count;
          const total = cart.reduce(
            (sum, item) => sum + Math.round(item.price * 100) * item.quantity,
            0,
          );
          carts.append(
            createEntry(
              store,
              count + (count === 1 ? " item" : " itens") + " · " + money(total),
              "Continuar compra",
              "/carrinho?" + params,
            ),
          );
        }
        const order = read<DemoOrder | null>(
          sessionStorage,
          "cardap-demo-order:" + encoded,
          null,
        );
        if (
          order &&
          typeof order.id === "string" &&
          order.id.startsWith("DEMO-") &&
          Number.isSafeInteger(order.total) &&
          order.total > 0 &&
          validItems(order.items).length
        ) {
          orderCount++;
          orders.append(
            createEntry(
              store,
              order.id +
                " · " +
                money(order.total) +
                " · Simulação sem pagamento",
              "Ver resumo",
              "/pedido-confirmado?" + params,
            ),
          );
        }
      });
      query<HTMLElement>("#cart-count").textContent = String(itemCount);
      query<HTMLElement>("#order-count").textContent = String(orderCount);
      query<HTMLElement>("#no-carts").hidden = itemCount > 0;
      query<HTMLElement>("#no-orders").hidden = orderCount > 0;
    };
    query<HTMLButtonElement>("#demo-login").addEventListener("click", () => {
      try {
        sessionStorage.setItem(
          userKey,
          JSON.stringify({
            id: "demo-customer",
            name: "Cliente de demonstração",
            email: "cliente@example.com",
            demo: true,
          }),
        );
        render();
      } catch {
        query<HTMLElement>("#guest-status").textContent =
          "Não foi possível iniciar a sessão neste navegador.";
      }
    });
    query<HTMLButtonElement>("#sign-out").addEventListener("click", () => {
      try {
        sessionStorage.removeItem(userKey);
        query<HTMLFormElement>("#profile-form").reset();
        query<HTMLElement>("#profile-status").textContent = "";
        render();
        query<HTMLElement>("#account-status").textContent =
          "Você saiu da sessão de demonstração.";
        query<HTMLButtonElement>("#demo-login").focus();
      } catch {
        query<HTMLElement>("#account-status").textContent =
          "Não foi possível encerrar a sessão. Tente novamente.";
      }
    });
    query<HTMLFormElement>("#profile-form").addEventListener(
      "submit",
      (event) => {
        event.preventDefault();
        const user = getUser();
        if (!user) {
          render();
          return;
        }
        const name = query<HTMLInputElement>("#profile-name").value.trim();
        const email = query<HTMLInputElement>("#profile-email").value.trim();
        if (name.length < 2) {
          query<HTMLElement>("#profile-status").textContent =
            "Informe um nome com pelo menos dois caracteres.";
          return;
        }
        if (!(event.target as HTMLFormElement).reportValidity()) return;
        try {
          sessionStorage.setItem(
            userKey,
            JSON.stringify({ ...user, name, email }),
          );
          render();
          query<HTMLElement>("#profile-status").textContent =
            "Perfil atualizado nesta sessão de demonstração.";
        } catch {
          query<HTMLElement>("#profile-status").textContent =
            "Não foi possível salvar o perfil.";
        }
      },
    );
    listenWindow("pageshow", render);
    listenWindow("storage", render);
    render();
  })();

  return () => {
    controller.abort();
    delete document.body.dataset.step;
    document.body.classList.remove("has-floating-cart");
  };
}
