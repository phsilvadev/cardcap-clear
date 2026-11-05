import { query, queryAll } from "@/lib/dom";
export default function initialize() {
  const controller = new AbortController();

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
  const stateSelect = query<HTMLSelectElement>("#state");
  const options = states
    .filter(
      (uf) =>
        !Array.from(stateSelect.options).some((option) => option.value === uf),
    )
    .map((uf) => new Option(uf, uf));
  options.forEach((option) => stateSelect.add(option));
  query<HTMLFormElement>("#location-form").addEventListener(
    "submit",
    (event) => {
      event.preventDefault();
      const city = query<HTMLInputElement>("#city");
      if (!city.value.trim()) {
        city.setCustomValidity("Informe o nome da cidade.");
        city.reportValidity();
        return;
      }
      const params = new URLSearchParams({
        city: city.value.trim(),
        state: stateSelect.value,
      });
      window.location.href = `/restaurantes?${params.toString()}`;
    },
    { signal: controller.signal },
  );
  query<HTMLInputElement>("#city").addEventListener(
    "input",
    (event) => {
      (event.target as HTMLInputElement).setCustomValidity("");
      query<HTMLElement>("#search-feedback").textContent = "";
    },
    { signal: controller.signal },
  );
  stateSelect.addEventListener(
    "change",
    () => {
      query<HTMLElement>("#search-feedback").textContent = "";
    },
    { signal: controller.signal },
  );
  const messages: Record<string, [string, string]> = {
    terms: [
      "Termos de uso",
      "Consulte as condições de compra, entrega e cancelamento diretamente com o restaurante escolhido antes de concluir seu pedido.",
    ],
    privacy: [
      "Privacidade",
      "Para esclarecer dúvidas sobre o tratamento dos seus dados, entre em contato com o suporte do Cardap pela área da sua conta.",
    ],
    contact: [
      "Contato",
      "Precisa de ajuda? Acesse Minha conta para encontrar o suporte. Para assuntos relacionados a um pedido, fale com o restaurante responsável.",
    ],
    login: [
      "Entrar no Cardap",
      "A conta do consumidor ainda é demonstrativa. Você pode comprar como visitante nas lojas disponíveis.",
    ],
    about: [
      "Uma nova apresentação para o Cardap",
      "Encontre restaurantes da sua região, consulte o cardápio e acompanhe seu pedido. O acesso do restaurante é separado da conta do consumidor.",
    ],
  };
  const dialog = query<HTMLDialogElement>("#info-dialog");
  queryAll<HTMLButtonElement>("[data-info]").forEach((button) =>
    button.addEventListener(
      "click",
      () => {
        const [title, description] = messages[button.dataset.info ?? "about"];
        query<HTMLElement>("#dialog-title").textContent = title;
        query<HTMLElement>("#dialog-description").textContent = description;
        dialog.showModal();
      },
      { signal: controller.signal },
    ),
  );

  return () => {
    controller.abort();
    options.forEach((option) => option.remove());
    delete document.body.dataset.step;
    document.body.classList.remove("has-floating-cart");
  };
}
