import type { CartItem, Customer } from "@/lib/types";
import { query, queryAll } from "@/lib/dom";
export default function initialize() {
  const controller = new AbortController();
  const listenWindow = (type: keyof WindowEventMap, handler: EventListener) =>
    window.addEventListener(type, handler, { signal: controller.signal });

  const params = new URLSearchParams(location.search);
  const stores: Record<string, [string, string]> = {
    "Quintal da Mesa": ["Brasileira", "Comida de casa, feita com carinho."],
    "Ponto do Burger": ["Hambúrgueres", "Seu próximo hambúrguer favorito."],
    "Forno & Massa": ["Pizzas", "Uma boa pizza sempre reúne."],
    "Café da Esquina": ["Cafés", "Uma pausa com sabor de café."],
    "Doce Encontro": ["Sobremesas", "Um doce motivo para ficar por perto."],
    "Tempero de Casa": ["Brasileira", "O sabor de uma boa descoberta."],
  };
  const requestedStore = params.get("store") ?? "";
  const name = Object.hasOwn(stores, requestedStore)
    ? requestedStore
    : "Quintal da Mesa";
  const [category, description] = stores[name];
  const city = (params.get("city") || "").trim().slice(0, 100);
  const state = (params.get("state") || "").trim().toUpperCase();
  const states = [
    "AC",
    "AL",
    "AP",
    "AM",
    "BA",
    "CE",
    "DF",
    "ES",
    "GO",
    "MA",
    "MT",
    "MS",
    "MG",
    "PA",
    "PB",
    "PR",
    "PE",
    "PI",
    "RJ",
    "RN",
    "RS",
    "RO",
    "RR",
    "SC",
    "SP",
    "SE",
    "TO",
  ];
  const hasRegion = city && states.includes(state);
  const region = hasRegion ? city + ", " + state : "Região não informada";
  const menus: Record<string, [string, string, number][]> = {
    Brasileira: [
      ["Prato da casa", "Arroz, feijão, proteína grelhada e salada.", 29.9],
      ["Executivo de frango", "Frango grelhado com arroz e legumes.", 26.9],
      ["Opção vegetariana", "Arroz, feijão, legumes e salada fresca.", 24.9],
    ],
    Hambúrgueres: [
      [
        "Burger da casa",
        "Pão, hambúrguer, queijo, salada e molho da casa.",
        29.9,
      ],
      ["Cheeseburger", "Pão, hambúrguer e queijo derretido.", 24.9],
      ["Burger vegetariano", "Pão, hambúrguer de legumes e salada.", 27.9],
    ],
    Pizzas: [
      ["Pizza de muçarela", "Molho de tomate, muçarela e orégano.", 44.9],
      ["Pizza de calabresa", "Muçarela, calabresa e cebola.", 49.9],
      ["Pizza marguerita", "Muçarela, tomate e manjericão.", 46.9],
    ],
    Cafés: [
      ["Café espresso", "Café intenso, preparado na hora.", 6.9],
      ["Cappuccino", "Café com leite cremoso e chocolate.", 12.9],
      ["Pão de queijo", "Porção de pães de queijo quentinhos.", 9.9],
    ],
    Sobremesas: [
      [
        "Brownie de chocolate",
        "Brownie macio com cobertura de chocolate.",
        14.9,
      ],
      ["Pudim da casa", "Pudim de leite com calda de caramelo.", 12.9],
      ["Sorvete artesanal", "Duas bolas de sorvete em uma taça.", 16.9],
    ],
  };
  const items = [
    ...menus[category].map(([name, description, price]) => ({
      name,
      description,
      price,
      category: "Especialidades",
    })),
    {
      name: "Água mineral",
      description: "Garrafa de 500 ml.",
      price: 4.9,
      category: "Bebidas",
    },
    {
      name: "Suco natural",
      description: "Suco de laranja, copo de 300 ml.",
      price: 8.9,
      category: "Bebidas",
    },
  ];
  const illustrations: Record<string, string> = {
    Brasileira:
      '<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-soup" aria-hidden="true" focusable="false"><path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z"></path><path d="M7 21h10"></path><path d="M19.5 12 22 6"></path><path d="M16.25 3c.27.1.8.53.75 1.36-.06.83-.93 1.2-1 2.02-.05.78.34 1.24.73 1.62"></path><path d="M11.25 3c.27.1.8.53.74 1.36-.05.83-.93 1.2-.98 2.02-.06.78.33 1.24.72 1.62"></path><path d="M6.25 3c.27.1.8.53.75 1.36-.06.83-.93 1.2-1 2.02-.05.78.34 1.24.74 1.62"></path></svg>',
    Hambúrgueres:
      '<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sandwich" aria-hidden="true" focusable="false"><path d="m2.37 11.223 8.372-6.777a2 2 0 0 1 2.516 0l8.371 6.777"></path><path d="M21 15a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-5.25"></path><path d="M3 15a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h9"></path><path d="m6.67 15 6.13 4.6a2 2 0 0 0 2.8-.4l3.15-4.2"></path><rect width="20" height="4" x="2" y="11" rx="1"></rect></svg>',
    Pizzas:
      '<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pizza" aria-hidden="true" focusable="false"><path d="m12 14-1 1"></path><path d="m13.75 18.25-1.25 1.42"></path><path d="M17.775 5.654a15.68 15.68 0 0 0-12.121 12.12"></path><path d="M18.8 9.3a1 1 0 0 0 2.1 7.7"></path><path d="M21.964 20.732a1 1 0 0 1-1.232 1.232l-18-5a1 1 0 0 1-.695-1.232A19.68 19.68 0 0 1 15.732 2.037a1 1 0 0 1 1.232.695z"></path></svg>',
    Cafés:
      '<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-coffee" aria-hidden="true" focusable="false"><path d="M10 2v2"></path><path d="M14 2v2"></path><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"></path><path d="M6 2v2"></path></svg>',
    Sobremesas:
      '<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-ice-cream-bowl" aria-hidden="true" focusable="false"><path d="M12 17c5 0 8-2.69 8-6H4c0 3.31 3 6 8 6m-4 4h8m-4-3v3M5.14 11a3.5 3.5 0 1 1 6.71 0"></path><path d="M12.14 11a3.5 3.5 0 1 1 6.71 0"></path><path d="M15.5 6.5a3.5 3.5 0 1 0-7 0"></path></svg>',
    Bebidas:
      '<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-glass-water" aria-hidden="true" focusable="false"><path d="M5.116 4.104A1 1 0 0 1 6.11 3h11.78a1 1 0 0 1 .994 1.105L17.19 20.21A2 2 0 0 1 15.2 22H8.8a2 2 0 0 1-2-1.79z"></path><path d="M6 12a5 5 0 0 1 6 0 5 5 0 0 0 6 0"></path></svg>',
  };

  const requestedProduct = params.get("product");
  const item =
    items.find((product) => product.name === requestedProduct) || items[0];
  const backParams = new URLSearchParams({ store: name });
  if (hasRegion) {
    backParams.set("city", city);
    backParams.set("state", state);
  }
  const storeUrl = "/loja?" + backParams.toString();
  queryAll<HTMLAnchorElement>("#back,#product-store,#menu-link").forEach(
    (link) => {
      link.href = storeUrl;
    },
  );
  query<HTMLAnchorElement>("#product-store").textContent = name;
  query<HTMLElement>("#product-region").textContent = region;
  query<HTMLElement>("#product-name").textContent = item.name;
  query<HTMLElement>("#product-description").textContent = item.description;
  query<HTMLElement>("#product-category").textContent =
    item.category === "Bebidas" ? "Bebidas" : category;
  query<HTMLElement>("#product-price").textContent = new Intl.NumberFormat(
    "pt-BR",
    { style: "currency", currency: "BRL" },
  ).format(item.price);
  query<HTMLElement>("#product-art").innerHTML =
    illustrations[item.category === "Bebidas" ? "Bebidas" : category];
  document.title = item.name + " — " + name + " — Cardap";

  let quantity = 1;
  const money = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  const feedback = query<HTMLElement>("#cart-feedback");
  const updateQuantity = () => {
    query<HTMLElement>("#quantity").textContent = String(quantity);
    query<HTMLButtonElement>("#quantity-minus").disabled = quantity <= 1;
    query<HTMLButtonElement>("#quantity-plus").disabled = quantity >= 99;
    query<HTMLElement>("#cart-total").textContent = money.format(
      (Math.round(item.price * 100) * quantity) / 100,
    );
  };
  query<HTMLButtonElement>("#quantity-minus").addEventListener("click", () => {
    quantity = Math.max(1, quantity - 1);
    feedback.textContent = "";
    updateQuantity();
  });
  query<HTMLButtonElement>("#quantity-plus").addEventListener("click", () => {
    quantity = Math.min(99, quantity + 1);
    feedback.textContent = "";
    updateQuantity();
  });
  query<HTMLButtonElement>("#add-to-cart").addEventListener("click", () => {
    if (hasDemoSession()) {
      addSelectedProductToCart();
      return;
    }
    query<HTMLElement>("#login-feedback").textContent = "";
    query<HTMLDialogElement>("#login-dialog").showModal();
  });
  const addSelectedProductToCart = () => {
    try {
      const key = "cardap-demo-cart:" + encodeURIComponent(name);
      let cart: CartItem[] = [];
      try {
        const saved: unknown = JSON.parse(localStorage.getItem(key) || "[]");
        if (Array.isArray(saved))
          cart = saved.filter(
            (entry) =>
              entry &&
              typeof entry.name === "string" &&
              Number.isInteger(entry.quantity) &&
              entry.quantity > 0 &&
              entry.quantity <= 99 &&
              Number.isFinite(entry.price),
          );
      } catch {
        cart = [];
      }
      const existing = cart.find((entry) => entry.name === item.name);
      if (existing && existing.quantity + quantity > 99) {
        feedback.textContent =
          "O limite é de 99 unidades deste produto no carrinho.";
        return;
      }
      if (existing) {
        existing.quantity += quantity;
        existing.price = item.price;
      } else {
        cart.push({ name: item.name, price: item.price, quantity });
      }
      localStorage.setItem(key, JSON.stringify(cart));
      updateFloatingCart();
      feedback.textContent =
        quantity +
        (quantity === 1 ? " unidade adicionada" : " unidades adicionadas") +
        " ao carrinho de " +
        name +
        ".";
    } catch {
      feedback.textContent =
        "Não foi possível salvar o carrinho neste navegador. Tente novamente.";
    }
  };
  updateQuantity();

  const readStoreCart = (): CartItem[] => {
    try {
      const saved: unknown = JSON.parse(
        localStorage.getItem("cardap-demo-cart:" + encodeURIComponent(name)) ||
          "[]",
      );
      return Array.isArray(saved)
        ? saved.filter(
            (entry) =>
              entry &&
              typeof entry.name === "string" &&
              Number.isInteger(entry.quantity) &&
              entry.quantity > 0 &&
              entry.quantity <= 99 &&
              Number.isFinite(entry.price) &&
              entry.price >= 0,
          )
        : [];
    } catch {
      return [];
    }
  };
  const updateFloatingCart = () => {
    const cart = readStoreCart();
    const count = cart.reduce((sum, entry) => sum + entry.quantity, 0);
    const button = query<HTMLButtonElement>("#floating-cart");
    button.hidden = count === 0;
    button.setAttribute(
      "aria-label",
      "Ver carrinho com " + count + (count === 1 ? " item" : " itens"),
    );
    query<HTMLElement>("#floating-count").textContent = String(count);
    document.body.classList.toggle("has-floating-cart", count > 0);
    query<HTMLElement>("#cart-dialog-store").textContent = name;
    const list = query<HTMLElement>("#cart-dialog-items");
    list.replaceChildren();
    cart.forEach((entry) => {
      const row = document.createElement("li");
      const label = document.createElement("span");
      label.textContent = entry.quantity + " × " + entry.name;
      const actions = document.createElement("div");
      actions.className = "cart-item-actions";
      const price = document.createElement("strong");
      price.textContent = money.format(
        (Math.round(entry.price * 100) * entry.quantity) / 100,
      );
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "cart-remove";
      remove.textContent = "Remover";
      remove.setAttribute(
        "aria-label",
        "Remover " + entry.name + " do carrinho",
      );
      remove.addEventListener("click", () => {
        try {
          const index = cart.findIndex((item) => item.name === entry.name);
          const remaining = readStoreCart().filter(
            (item) => item.name !== entry.name,
          );
          localStorage.setItem(
            "cardap-demo-cart:" + encodeURIComponent(name),
            JSON.stringify(remaining),
          );
          updateFloatingCart();
          const nextButtons = queryAll<HTMLButtonElement>(".cart-remove");
          if (nextButtons.length)
            nextButtons[Math.min(index, nextButtons.length - 1)].focus();
          else query<HTMLElement>("#cart-dialog button").focus();
          feedback.textContent = entry.name + " removido do carrinho.";
        } catch {
          query<HTMLElement>("#cart-modal-feedback").textContent =
            "Não foi possível remover o item. Tente novamente.";
        }
      });
      actions.append(price, remove);
      row.append(label, actions);
      list.append(row);
    });
    query<HTMLElement>("#cart-empty").hidden = count > 0;
    const checkoutLink = query<HTMLAnchorElement>("#cart-checkout-link");
    checkoutLink.href = "/carrinho?" + backParams.toString();
    checkoutLink.hidden = count === 0;
    query<HTMLElement>("#cart-modal-feedback").textContent = "";
    query<HTMLElement>("#cart-dialog-total").textContent = money.format(
      cart.reduce(
        (sum, entry) => sum + Math.round(entry.price * 100) * entry.quantity,
        0,
      ) / 100,
    );
  };
  query<HTMLButtonElement>("#floating-cart").addEventListener("click", () => {
    updateFloatingCart();
    query<HTMLDialogElement>("#cart-dialog").showModal();
  });
  listenWindow("storage", updateFloatingCart);
  listenWindow("pageshow", updateFloatingCart);
  updateFloatingCart();

  const loginDialog = query<HTMLDialogElement>("#login-dialog");
  const hasDemoSession = () => {
    try {
      const user = JSON.parse(
        sessionStorage.getItem("cardap-demo-user") || "null",
      ) as Customer | null;
      return user?.id === "demo-customer" && user?.demo === true;
    } catch {
      return false;
    }
  };
  const enterDemoSession = () => {
    try {
      sessionStorage.setItem(
        "cardap-demo-user",
        JSON.stringify({
          id: "demo-customer",
          name: "Cliente de demonstração",
          email: "cliente@example.com",
          demo: true,
        }),
      );
      query<HTMLFormElement>("#login-form").reset();
      loginDialog.close();
      addSelectedProductToCart();
    } catch {
      query<HTMLElement>("#login-feedback").textContent =
        "Não foi possível iniciar a sessão de demonstração neste navegador.";
    }
  };
  query<HTMLFormElement>("#login-form").addEventListener("submit", (event) => {
    event.preventDefault();
    enterDemoSession();
  });
  query<HTMLButtonElement>("#login-google").addEventListener(
    "click",
    enterDemoSession,
  );
  loginDialog.addEventListener("close", () => {
    query<HTMLFormElement>("#login-form").reset();
    query<HTMLElement>("#login-feedback").textContent = "";
  });

  return () => {
    controller.abort();
    delete document.body.dataset.step;
    document.body.classList.remove("has-floating-cart");
  };
}
