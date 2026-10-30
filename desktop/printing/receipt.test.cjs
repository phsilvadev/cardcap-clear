const { test } = require("node:test");
const assert = require("node:assert/strict");
const { receiptHtml, validateJob, trustedUrl } = require("./receipt.cjs");
const job = {
  id: "loja:1048:accepted",
  storeId: "owner",
  storeName: "Loja",
  order: {
    id: "1048",
    customer: "Ana <script>alert(1)</script>",
    items: "2 × Prato · 1 × Água",
    total: 5980,
    status: "preparing",
    time: "Há 3 min",
  },
};
test("comanda escapa conteúdo e separa os itens", () => {
  const html = receiptHtml(job, 58);
  assert(!html.includes("<script>"));
  assert(html.includes("&lt;script&gt;"));
  assert(html.includes("size: 58mm"));
  assert.equal((html.match(/<li>/g) || []).length, 2);
  assert(html.includes("59,80"));
});
test("recusa payload inválido e pedidos ainda não aceitos", () => {
  for (const input of [
    null,
    { ...job, order: { ...job.order, total: NaN } },
    { ...job, order: { ...job.order, status: "new" } },
    { ...job, order: { ...job.order, status: "cancelled" } },
  ])
    assert.throws(() => validateJob(input));
});
test("permite HTTPS e HTTP local, recusa outros protocolos e credenciais", () => {
  assert.equal(
    trustedUrl("https://cardap.example/dashboard/pedidos").protocol,
    "https:",
  );
  assert.equal(trustedUrl("http://localhost:3001").hostname, "localhost");
  for (const url of [
    "file:///etc/passwd",
    "javascript:alert(1)",
    "http://untrusted.example",
    "https://user:password@example.com",
  ])
    assert.throws(() => trustedUrl(url));
});
