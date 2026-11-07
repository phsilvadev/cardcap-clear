const test = require("node:test");
const assert = require("node:assert/strict");
const { createTurnstileVerifier } = require("./turnstile.cjs");

test("aceita apenas token válido para o domínio e ação esperados", async () => {
  for (const [result, expected] of [
    [
      { success: true, hostname: "cardap.example", action: "launch_signup" },
      true,
    ],
    [{ success: false }, false],
    [
      { success: true, hostname: "other.example", action: "launch_signup" },
      false,
    ],
    [{ success: true, hostname: "cardap.example", action: "login" }, false],
  ]) {
    const verify = createTurnstileVerifier({
      secret: () => "test-secret",
      hostnames: () => "cardap.example",
      fetchImpl: async (url, options) => {
        assert.equal(
          url,
          "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        );
        assert.deepEqual(JSON.parse(options.body), {
          secret: "test-secret",
          response: "token",
        });
        return { ok: true, json: async () => result };
      },
    });
    assert.equal(await verify("token"), expected);
  }
});

test("nega tokens ausentes, configuração incompleta e falhas de rede", async () => {
  const verify = createTurnstileVerifier({
    secret: () => "test-secret",
    hostnames: () => "cardap.example",
    fetchImpl: async () => {
      throw new Error("offline");
    },
  });
  for (const token of [undefined, "", "x".repeat(2049), "token"])
    assert.equal(await verify(token), false);
  const missing = createTurnstileVerifier({
    secret: () => "",
    hostnames: () => "",
  });
  assert.equal(await missing("token"), false);
});
