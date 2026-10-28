import { query, queryAll } from "../dom";
export default function initialize() {
  const controller = new AbortController();

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
  const backParams = new URLSearchParams();
  if (hasRegion) {
    backParams.set("city", city);
    backParams.set("state", state);
  }
  const backUrl =
    "/restaurantes" + (hasRegion ? "?" + backParams.toString() : "");
  queryAll<HTMLAnchorElement>("#back,#footer-back").forEach((link) => {
    link.href = backUrl;
  });
  document.title = name + " — Cardap";
  query<HTMLElement>("#store-name").textContent = name;
  query<HTMLElement>("#store-category").textContent = category;
  query<HTMLElement>("#store-description").textContent = description;
  query<HTMLElement>("#store-region").textContent = region;
  query<HTMLElement>("#info-description").textContent =
    name + " · " + category + " · " + region;
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
  const format = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  const container = query<HTMLElement>("#menu-products");
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
  ["Especialidades", "Bebidas"].forEach((groupName) => {
    const section = document.createElement("section");
    section.className = "menu-group";
    section.dataset.group = groupName;
    const heading = document.createElement("div");
    heading.className = "group-heading";
    const title = document.createElement("h3");
    title.textContent = groupName === "Especialidades" ? category : groupName;
    const all = document.createElement("button");
    all.type = "button";
    all.textContent = "Ver todos";
    all.dataset.showGroup = groupName;
    all.addEventListener("click", () => {
      active = groupName;
      input.value = "";
      render();
      query<HTMLElement>("#menu-title").scrollIntoView({ block: "start" });
    });
    heading.append(title, all);
    section.append(heading);
    const grid = document.createElement("div");
    grid.className = "menu-grid";
    items
      .filter((item) => item.category === groupName)
      .forEach((item) => {
        const article = document.createElement("a");
        article.className = "product";
        article.dataset.category = item.category;
        article.dataset.name = item.name;
        const productParams = new URLSearchParams({
          store: name,
          product: item.name,
        });
        if (hasRegion) {
          productParams.set("city", city);
          productParams.set("state", state);
        }
        article.href = "/produto?" + productParams.toString();
        const art = document.createElement("div");
        art.className = "product-art";
        art.innerHTML =
          illustrations[groupName === "Bebidas" ? "Bebidas" : category];
        const title = document.createElement("h4");
        title.textContent = item.name;
        const description = document.createElement("p");
        description.textContent = item.description;
        const price = document.createElement("strong");
        price.textContent = format.format(item.price);
        article.append(art, description, title, price);
        grid.append(article);
      });
    section.append(grid);
    container.append(section);
  });
  query<HTMLButtonElement>("#main-category").textContent = category;
  let active = "Todos";
  const input = query<HTMLInputElement>("#menu-search");
  const normalize = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const render = () => {
    let count = 0;
    container.querySelectorAll<HTMLElement>(".product").forEach((card) => {
      const show =
        (active === "Todos" || card.dataset.category === active) &&
        normalize(card.dataset.name ?? "").includes(
          normalize(input.value.trim()),
        );
      card.hidden = !show;
      if (show) count++;
    });
    container.querySelectorAll<HTMLElement>(".menu-group").forEach((group) => {
      group.hidden = ![...group.querySelectorAll<HTMLElement>(".product")].some(
        (card) => !card.hidden,
      );
      query<HTMLButtonElement>("[data-show-group]", group).hidden =
        active !== "Todos";
    });
    query<HTMLElement>("#menu-count").textContent =
      count + (count === 1 ? " item de exemplo" : " itens de exemplo");
    query<HTMLElement>("#menu-empty").hidden = count > 0;
    queryAll<HTMLButtonElement>("[data-menu]").forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.menu === active),
      ),
    );
  };
  queryAll<HTMLButtonElement>("[data-menu]").forEach((button) =>
    button.addEventListener("click", () => {
      active = button.dataset.menu ?? "Todos";
      render();
    }),
  );
  input.addEventListener("input", render);
  query<HTMLButtonElement>("#info-button").addEventListener("click", () =>
    query<HTMLDialogElement>("#store-info").showModal(),
  );
  render();

  return () => {
    controller.abort();
    delete document.body.dataset.step;
    document.body.classList.remove("has-floating-cart");
  };
}
