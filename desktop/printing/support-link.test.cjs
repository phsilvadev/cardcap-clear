const { test } = require("node:test");
const assert = require("node:assert/strict");
const { allowedSupportLink } = require("./support-link.cjs");
test("permite somente link HTTPS de conversa no WhatsApp", () => {
  assert(
    allowedSupportLink("https://wa.me/5586995747604?text=Preciso%20de%20ajuda"),
  );
  for (const url of [
    "javascript:alert(1)",
    "file:///etc/passwd",
    "https://evil.example",
    "https://wa.me.evil.example/5586995747604",
    "https://user:secret@wa.me/5586995747604",
    "https://wa.me/redirect?url=https://evil.example",
    "http://wa.me/5586995747604",
    "https://wa.me/5586995747604?extra=1",
  ])
    assert(!allowedSupportLink(url));
});
