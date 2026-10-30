const { test } = require("node:test");
const assert = require("node:assert/strict");
const { allowedPanelUrl } = require("./panel-origin.cjs");
test("Electron permite subdomínio local na mesma porta sem liberar outros hosts", () => {
  const base = "http://localhost:3001/dashboard/pedidos";
  assert(
    allowedPanelUrl(
      "http://hero-burger.localhost:3001/api/auth/transfer",
      base,
    ),
  );
  assert(!allowedPanelUrl("http://hero-burger.localhost:3002", base));
  assert(!allowedPanelUrl("http://hero-burger.localhost.evil.com:3001", base));
  assert(!allowedPanelUrl("file:///etc/passwd", base));
  assert(!allowedPanelUrl("http://evil.example", base));
});
test("produção limita navegação ao domínio configurado", () => {
  const base = "https://app.example.com";
  assert(
    allowedPanelUrl(
      "https://hero-burger.example.com/dashboard",
      base,
      "example.com",
    ),
  );
  assert(!allowedPanelUrl("https://example.com.evil.com", base, "example.com"));
  assert(
    !allowedPanelUrl(
      "https://deep.hero-burger.example.com",
      base,
      "example.com",
    ),
  );
  assert(
    !allowedPanelUrl("http://hero-burger.example.com", base, "example.com"),
  );
});
