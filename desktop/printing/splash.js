window.cardapStartup.onState((state) => {
  document.getElementById("spinner").hidden = state.error;
  document.getElementById("actions").hidden = !state.error;
  document.getElementById("status").textContent = state.error
    ? "Não foi possível preparar o painel. Confira a conexão e o endereço da plataforma."
    : "Preparando seu painel e verificando a sessão…";
});
for (const action of ["retry", "configure", "quit"])
  document.getElementById(action).addEventListener("click", () => {
    void window.cardapStartup[action]().catch(() => {
      document.getElementById("status").textContent =
        "Não foi possível concluir. Tente novamente.";
    });
  });
