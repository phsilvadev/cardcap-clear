import type { Tenant } from "@/lib/tenant";
import type { DashboardState, DashboardOrder, OrderStatus } from "@/lib/types";
import { getDemoOrderStore } from "@/lib/orders/demo-store";
import { query, queryAll } from "@/lib/dom";
export default function initialize(tenant: Tenant) {
  const controller = new AbortController();
  (() => {
    const key = `cardap-demo-dashboard:${tenant.slug}`;
    const orderStore = getDemoOrderStore(tenant.slug);
    orderStore.hydrate();
    const initial: DashboardState = {
      open: true,
      settings: {
        name: tenant.name,
        phone: "(11) 99999-0000",
        description: "Comida de casa, feita com carinho.",
      },
      orders: orderStore.getSnapshot().orders,
      products: [
        { name: "Prato da casa", price: 2990, active: true },
        { name: "Executivo de frango", price: 2690, active: true },
        { name: "Opção vegetariana", price: 2490, active: true },
        { name: "Água mineral", price: 490, active: true },
        { name: "Suco natural", price: 890, active: false },
      ],
    };
    let state = structuredClone(initial);
    try {
      const saved = JSON.parse(
        sessionStorage.getItem(key) || "null",
      ) as DashboardState | null;
      if (
        saved &&
        typeof saved.open === "boolean" &&
        typeof saved.settings?.name === "string" &&
        typeof saved.settings?.phone === "string" &&
        typeof saved.settings?.description === "string" &&
        Array.isArray(saved.orders) &&
        saved.orders.length === initial.orders.length &&
        saved.orders.every(
          (order: DashboardOrder, i: number) =>
            order.id === initial.orders[i].id &&
            ["new", "preparing", "delivery", "done"].includes(order.status),
        ) &&
        Array.isArray(saved.products) &&
        saved.products.length === initial.products.length
      ) {
        state.open = saved.open;
        state.settings = saved.settings;
        state.products.forEach(
          (product, i) =>
            (product.active =
              typeof saved.products[i]?.active === "boolean"
                ? saved.products[i].active
                : product.active),
        );
      }
    } catch {}
    const money = (cents: number) =>
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(cents / 100);
    const feedback = (message: string) =>
      (query<HTMLElement>("#dashboard-feedback").textContent = message);
    const save = () => {
      try {
        sessionStorage.setItem(
          key,
          JSON.stringify({
            ...state,
            orders: orderStore.getSnapshot().orders,
            couriers: orderStore.getSnapshot().couriers,
          }),
        );
        return true;
      } catch {
        feedback("Não foi possível salvar as alterações nesta sessão.");
        return false;
      }
    };
    const headings: Record<string, [string, string, string]> = {
      overview: [
        "Visão geral",
        "Tudo pronto para servir.",
        "Acompanhe os pedidos e cuide do seu restaurante.",
      ],
      orders: [
        "Pedidos",
        "Pedidos",
        "Organize o preparo e acompanhe as entregas.",
      ],
      menu: [
        "Cardápio",
        "Seu cardápio em dia.",
        "Gerencie os produtos disponíveis para seus clientes.",
      ],
      settings: [
        "Configurações",
        "Do seu jeito.",
        "Atualize os dados do restaurante nesta demonstração.",
      ],
    };
    const navigate = (view: string = "overview") => {
      if (view === "menu") {
        window.location.assign("/dashboard/cardapio");
        return;
      }
      if (!Object.hasOwn(headings, view)) view = "overview";
      query<HTMLElement>(".demo-banner").hidden =
        view === "settings" || view === "orders";
      query<HTMLElement>(".dashboard-heading .eyebrow").hidden =
        view === "orders";
      query<HTMLElement>("#view-description").hidden = view === "orders";
      queryAll<HTMLElement>(".dashboard-view").forEach(
        (section) => (section.hidden = section.id !== "view-" + view),
      );
      queryAll<HTMLAnchorElement>("[data-view]").forEach((button) => {
        if (button.dataset.view === view)
          button.setAttribute("aria-current", "page");
        else button.removeAttribute("aria-current");
      });
      const [label, title, description] = headings[view];
      query<HTMLElement>("#breadcrumb").textContent = label;
      query<HTMLElement>("#view-title").textContent = title;
      query<HTMLElement>("#view-description").textContent = description;
      feedback("");
    };
    const labels: Record<OrderStatus, string> = {
      new: "Novo",
      preparing: "Em preparo",
      delivery: "Em entrega",
      done: "Concluído",
    };
    const next: Partial<Record<OrderStatus, OrderStatus>> = {
      new: "preparing",
      preparing: "delivery",
      delivery: "done",
    };
    const actionLabels: Partial<Record<OrderStatus, string>> = {
      new: "Aceitar pedido",
      preparing: "Saiu para entrega",
      delivery: "Concluir pedido",
    };
    const orderCard = (order: DashboardOrder) => {
      const article = document.createElement("article");
      article.className = "order-card";
      const copy = document.createElement("div");
      const title = document.createElement("h3");
      title.textContent = "#" + order.id + " · " + order.customer;
      const description = document.createElement("p");
      description.textContent = order.items + " · " + order.time;
      copy.append(title, description);
      const side = document.createElement("div");
      side.className = "order-side";
      const price = document.createElement("strong");
      price.textContent = money(order.total);
      const badge = document.createElement("span");
      badge.className = "status-pill " + order.status;
      badge.textContent = labels[order.status];
      side.append(price, badge);
      if (next[order.status]) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "order-action";
        button.textContent = actionLabels[order.status] ?? "";
        button.setAttribute(
          "aria-label",
          actionLabels[order.status] + " #" + order.id,
        );
        button.onclick = () => {
          orderStore.advance(order.id);
        };
        side.append(button);
      }
      article.append(copy, side);
      return article;
    };
    const renderOrders = () => {
      query<HTMLElement>("#recent-orders").replaceChildren(
        ...state.orders.slice(0, 3).map(orderCard),
      );
    };
    const render = () => {
      queryAll<HTMLElement>(".store-name").forEach(
        (node) => (node.textContent = state.settings.name),
      );
      query<HTMLElement>("#store-status").textContent = state.open
        ? "Recebendo pedidos"
        : "Recebimento pausado";
      query<HTMLButtonElement>("#store-toggle").setAttribute(
        "aria-checked",
        String(state.open),
      );
      const total = state.orders.reduce((sum, order) => sum + order.total, 0);
      query<HTMLElement>("#stat-orders").textContent = String(
        state.orders.length,
      );
      query<HTMLElement>("#stat-active").textContent = String(
        state.orders.filter((order) => order.status !== "done").length,
      );
      query<HTMLElement>("#stat-sales").textContent = money(total);
      query<HTMLElement>("#stat-average").textContent = money(
        Math.round(total / state.orders.length),
      );
      const operation = query<HTMLElement>("#operation-rows");
      operation.replaceChildren();
      [
        ["new", "Novos pedidos", "Aguardando sua confirmação"],
        ["preparing", "Em preparo", "Na cozinha, ganhando sabor"],
        ["delivery", "Em entrega", "A caminho do cliente"],
      ].forEach(([status, title, description]) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "action-row";
        const copy = document.createElement("span");
        const heading = document.createElement("strong");
        heading.textContent = title;
        const detail = document.createElement("small");
        detail.textContent = description;
        copy.append(heading, detail);
        const count = document.createElement("b");
        count.textContent = String(
          state.orders.filter((order) => order.status === status).length,
        );
        button.append(copy, count);
        button.onclick = () => {
          orderStore.setFilter(status as OrderStatus);
          renderOrders();
          navigate("orders");
        };
        operation.append(button);
      });
      renderOrders();
    };
    queryAll<HTMLAnchorElement>("[data-view]").forEach(
      (button) =>
        (button.onclick = (event) => {
          event.preventDefault();
          navigate(button.dataset.view);
        }),
    );
    queryAll<HTMLButtonElement>("[data-go]").forEach(
      (button) => (button.onclick = () => navigate(button.dataset.go)),
    );
    query<HTMLButtonElement>("#store-toggle").onclick = () => {
      state.open = !state.open;
      if (!save()) {
        state.open = !state.open;
        return;
      }
      render();
      feedback(
        state.open
          ? "Recebimento de pedidos ativado na demonstração."
          : "Recebimento pausado na demonstração.",
      );
    };
    query<HTMLInputElement>("#setting-name").value = state.settings.name;
    query<HTMLInputElement>("#setting-phone").value = state.settings.phone;
    query<HTMLTextAreaElement>("#setting-description").value =
      state.settings.description;
    query<HTMLFormElement>("#settings-form").addEventListener(
      "submit",
      (event) => {
        event.preventDefault();
        const name = query<HTMLInputElement>("#setting-name").value.trim();
        const phone = query<HTMLInputElement>("#setting-phone").value.trim();
        const description = query<HTMLTextAreaElement>(
          "#setting-description",
        ).value.trim();
        if (
          name.length < 2 ||
          !/^\d{10,11}$/.test(phone.replace(/\D/g, "")) ||
          !description
        ) {
          feedback("Confira o nome, o telefone com DDD e a descrição.");
          return;
        }
        const previous = state.settings;
        state.settings = { name, phone, description };
        if (!save()) {
          state.settings = previous;
          return;
        }
        render();
        feedback("Dados da loja salvos nesta sessão de demonstração.");
      },
    );
    const unsubscribeOrders = orderStore.subscribe(() => {
      state.orders = orderStore.getSnapshot().orders;
      render();
      if (query<HTMLElement>("#view-orders").hidden)
        feedback(orderStore.getSnapshot().message);
    });
    controller.signal.addEventListener("abort", unsubscribeOrders, {
      once: true,
    });
    render();
    navigate(
      new URLSearchParams(window.location.search).get("view") ?? "overview",
    );
  })();

  return () => {
    controller.abort();
    delete document.body.dataset.step;
    document.body.classList.remove("has-floating-cart");
  };
}
