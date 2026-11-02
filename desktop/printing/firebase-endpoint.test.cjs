const test = require("node:test");
const assert = require("node:assert/strict");
const { tenantOrdersEndpoint } = require("./firebase-endpoint.cjs");
test("usa o projeto do painel e permite selecionar a região", () => {
  assert.equal(
    tenantOrdersEndpoint(
      { projectId: "store-production", functionsRegion: "us-central1" },
      {},
    ),
    "https://us-central1-store-production.cloudfunctions.net/tenantOrderOperations",
  );
  assert.equal(
    tenantOrdersEndpoint({}, { CARDAP_FIREBASE_PROJECT_ID: "store-staging" }),
    "https://southamerica-east1-store-staging.cloudfunctions.net/tenantOrderOperations",
  );
});
test("rejeita hosts arbitrários e projetos diferentes do ambiente", () => {
  for (const session of [
    {},
    { projectId: "evil.test/path" },
    { projectId: "valid-project", functionsRegion: "http://evil.test" },
  ])
    assert.throws(() => tenantOrdersEndpoint(session, {}));
  assert.throws(() =>
    tenantOrdersEndpoint(
      { projectId: "other-project" },
      { CARDAP_FIREBASE_PROJECT_ID: "expected-project" },
    ),
  );
});
