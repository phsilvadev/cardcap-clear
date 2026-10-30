const feedback = document.getElementById("feedback");
async function load() {
  try {
    const { config, printers } = await window.printerSettings.load();
    document.getElementById("url").value = config.url;
    const select = document.getElementById("printer");
    select.replaceChildren();
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Selecione uma impressora";
    select.append(placeholder);
    for (const printer of printers) {
      const option = document.createElement("option");
      option.value = printer.name;
      option.textContent = printer.displayName || printer.name;
      select.append(option);
    }
    select.value = config.printer;
    document.getElementById("width").value = String(config.width);
    if (!printers.length)
      feedback.textContent =
        "Nenhuma impressora encontrada. Instale a impressora no sistema e reabra esta janela.";
  } catch {
    feedback.textContent = "Não foi possível carregar as impressoras.";
  }
}
document
  .getElementById("settings")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = document.getElementById("save");
    button.disabled = true;
    feedback.textContent = "";
    try {
      await window.printerSettings.save({
        url: document.getElementById("url").value,
        printer: document.getElementById("printer").value,
        width: Number(document.getElementById("width").value),
      });
    } catch (error) {
      feedback.textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });
document.getElementById("close").addEventListener("click", () => {
  void window.printerSettings.close().catch(() => {
    feedback.textContent = "Não foi possível fechar a janela.";
  });
});
void load();
