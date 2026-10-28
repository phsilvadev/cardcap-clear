import { query, queryAll } from "../dom";
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
  states.forEach((uf) => stateSelect.add(new Option(uf, uf)));
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
  );
  query<HTMLInputElement>("#city").addEventListener("input", (event) => {
    (event.target as HTMLInputElement).setCustomValidity("");
    query<HTMLElement>("#search-feedback").textContent = "";
  });
  stateSelect.addEventListener("change", () => {
    query<HTMLElement>("#search-feedback").textContent = "";
  });
  const messages: Record<string, [string, string]> = {
    partner: [
      "Área de parceiros",
      "O projeto Cardap possui uma área de parceiros com acesso e cadastro de estabelecimentos. Este HTML é uma prévia de design; a autenticação continua no aplicativo original.",
    ],
    login: [
      "Entrar no Cardap",
      "Este HTML demonstra a nova identidade visual. O acesso à conta não está conectado nesta prévia.",
    ],
    about: [
      "Uma nova apresentação para o Cardap",
      "Protótipo em HTML com Tailwind, inspirado nas cores, tipografia e botões do projeto Gelada. A busca, o acesso e o cadastro não estão integrados ao backend.",
    ],
  };
  const dialog = query<HTMLDialogElement>("#info-dialog");
  queryAll<HTMLButtonElement>("[data-info]").forEach((button) =>
    button.addEventListener("click", () => {
      const [title, description] = messages[button.dataset.info ?? "about"];
      query<HTMLElement>("#dialog-title").textContent = title;
      query<HTMLElement>("#dialog-description").textContent = description;
      dialog.showModal();
    }),
  );

  return () => {
    controller.abort();
    delete document.body.dataset.step;
    document.body.classList.remove("has-floating-cart");
  };
}
