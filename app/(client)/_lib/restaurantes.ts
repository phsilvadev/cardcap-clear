import { query, queryAll } from "@/lib/dom";
export default function initialize() {
  const controller = new AbortController();

  const params = new URLSearchParams(location.search);
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
  const hasRegion = Boolean(city && states.includes(state));
  const region = hasRegion
    ? city + ", " + state
    : "Escolha sua região para continuar";
  query<HTMLElement>("#region").textContent = region;
  queryAll<HTMLElement>(".card-region").forEach((element) => {
    element.textContent = region;
  });
  if (hasRegion) document.title = "Restaurantes em " + region + " — Cardap";
  const input = query<HTMLInputElement>("#restaurant-search");
  const cards = [...queryAll<HTMLAnchorElement>(".restaurant")];
  cards.forEach((card) => {
    const detailParams = new URLSearchParams({
      store: card.dataset.name ?? "",
      category: card.dataset.category ?? "",
    });
    if (hasRegion) {
      detailParams.set("city", city);
      detailParams.set("state", state);
    }
    card.href = "/loja?" + detailParams.toString();
  });
  const buttons = [...queryAll<HTMLButtonElement>(".category")];
  let category = "Todos";
  const normalize = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const render = () => {
    let count = 0;
    cards.forEach((card) => {
      const visible =
        hasRegion &&
        (category === "Todos" || card.dataset.category === category) &&
        normalize(card.dataset.name ?? "").includes(
          normalize(input.value.trim()),
        );
      card.hidden = !visible;
      if (visible) count++;
    });
    query<HTMLElement>("#result-count").textContent =
      count +
      (count === 1 ? " restaurante de exemplo" : " restaurantes de exemplo");
    query<HTMLElement>("#empty").hidden = count > 0;
    if (!hasRegion) {
      query<HTMLElement>("#empty h3").textContent = "Onde bateu a fome?";
      query<HTMLElement>("#empty p").textContent =
        "Escolha sua cidade e estado na página inicial para ver a prévia da listagem.";
      query<HTMLButtonElement>("#clear-filters").textContent =
        "Escolher região";
    }
    buttons.forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.category === category),
      ),
    );
  };
  input.addEventListener("input", render);
  buttons.forEach((button) =>
    button.addEventListener("click", () => {
      category = button.dataset.category ?? "Todos";
      render();
    }),
  );
  query<HTMLButtonElement>("#clear-filters").addEventListener("click", () => {
    if (!hasRegion) {
      location.href = "/#buscar";
      return;
    }
    category = "Todos";
    input.value = "";
    render();
  });
  render();

  return () => {
    controller.abort();
    delete document.body.dataset.step;
    document.body.classList.remove("has-floating-cart");
  };
}
