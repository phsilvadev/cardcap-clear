const test = require("node:test");
const assert = require("node:assert/strict");
const {
  storeSearchFields,
  createStoreSearchSync,
} = require("./store-search.cjs");
test("normaliza acentos e espaços sem depender do texto exibido da cidade", () => {
  assert.deepEqual(
    storeSearchFields({ city: "  São   Luís ", state: " ma " }),
    { publicCityKey: "sao luis", publicStateKey: "MA" },
  );
});
test("evento atrasado lê o endereço atual e não cria um ciclo de atualizações", async () => {
  let current = { city: "Recife", state: "PE" },
    writes = 0;
  const ref = { path: "tenants/owner" };
  const sync = createStoreSearchSync({
    db: {
      runTransaction: async (fn) =>
        fn({
          get: async (value) => {
            assert.equal(value, ref);
            return { data: () => current };
          },
          update: (_ref, fields) => {
            writes++;
            current = { ...current, ...fields };
          },
        }),
    },
  });
  const event = {
    data: {
      after: {
        ref,
        exists: true,
        data: () => ({ city: "São Paulo", state: "SP" }),
      },
    },
  };
  await sync(event);
  assert.equal(current.publicCityKey, "recife");
  assert.equal(writes, 1);
  await sync(event);
  assert.equal(writes, 1);
});
