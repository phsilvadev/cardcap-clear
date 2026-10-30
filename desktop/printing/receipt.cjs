const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );
function validateJob(job) {
  const short = (value, max) =>
    typeof value === "string" && value.trim().length > 0 && value.length <= max;
  if (
    !job ||
    !short(job.id, 200) ||
    !short(job.storeId, 128) ||
    !short(job.storeName, 120) ||
    !job.order ||
    !short(job.order.id, 100) ||
    !short(job.order.customer, 120) ||
    !short(job.order.items, 12000) ||
    !Number.isSafeInteger(job.order.total) ||
    job.order.total < 0 ||
    job.order.total > 100000000 ||
    !short(job.order.time, 100) ||
    !["preparing", "delivery", "done"].includes(job.order.status)
  )
    throw new Error("Comanda inválida.");
  return job;
}
function receiptHtml(input, width = 80) {
  const job = validateJob(input);
  const paper = width === 58 ? 58 : 80;
  const total = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(job.order.total / 100);
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'"><style>@page { size: ${paper}mm auto; margin: 3mm; } * { box-sizing: border-box; } body { width: ${paper - 6}mm; margin: 0; color: #000; font: 12px monospace; overflow-wrap: anywhere; } h1 { font-size: 20px; } h2 { font-size: 16px; } .line { border-top: 1px dashed #000; margin: 12px 0; } li { padding: 6px 0; } ul { padding-left: 18px; } small { font-size: 10px; }</style></head><body><h2>${escape(job.storeName)}</h2><h1>Pedido #${escape(job.order.id)}</h1><p>${escape(job.order.customer)}</p><p>${escape(job.order.time)}</p><div class="line"></div><h2>COMANDA DA COZINHA</h2><ul>${job.order.items
    .split(" · ")
    .map((item) => `<li>${escape(item)}</li>`)
    .join(
      "",
    )}</ul><div class="line"></div><h2>Total: ${escape(total)}</h2><small>Cardap · Comanda não fiscal</small></body></html>`;
}
function trustedUrl(value) {
  const url = new URL(value);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (
    url.username ||
    url.password ||
    (url.protocol !== "https:" && !(local && url.protocol === "http:"))
  )
    throw new Error("Use HTTPS ou um endereço local de desenvolvimento.");
  return url;
}
module.exports = { receiptHtml, validateJob, trustedUrl };
