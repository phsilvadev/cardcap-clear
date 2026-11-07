import { test, expect, type Page } from "@playwright/test";
import type { CustomerOrder } from "../lib/customer/types";

// Firebase Auth protocol and callable transport are mocked; no real accounts or e-mails are created.
async function mockCustomer(page: Page) {
  const uid = "test-customer",
    email = "cliente@example.com";
  const token = [
    Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url"),
    Buffer.from(
      JSON.stringify({
        sub: uid,
        user_id: uid,
        aud: "cardap-e0bf0",
        iss: "https://securetoken.google.com/cardap-e0bf0",
        auth_time: Math.floor(Date.now() / 1000),
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        email,
      }),
    ).toString("base64url"),
    "test",
  ].join(".");
  const state = {
    uid,
    name: "Maria Silva",
    email,
    phone: "11999990000",
    emailVerified: true,
    addresses: [] as Record<string, unknown>[],
    favorites: [] as { slug: string; name: string }[],
    orders: [] as CustomerOrder[],
  };
  await page.route(
    "https://identitytoolkit.googleapis.com/**",
    async (route) => {
      const url = route.request().url();
      if (url.includes(":lookup"))
        return route.fulfill({
          json: {
            users: [
              {
                localId: uid,
                email,
                displayName: state.name,
                emailVerified: true,
                providerUserInfo: [
                  { providerId: "password", email, federatedId: email },
                ],
              },
            ],
          },
        });
      return route.fulfill({
        json: {
          localId: uid,
          email,
          displayName: state.name,
          idToken: token,
          refreshToken: "test-refresh-token",
          expiresIn: "3600",
          registered: true,
        },
      });
    },
  );
  await page.route("**/customerOperations", async (route) => {
    const data = route.request().postDataJSON()?.data || {};
    if (!route.request().headers().authorization)
      return route.fulfill({
        status: 401,
        json: {
          error: { status: "UNAUTHENTICATED", message: "Entre novamente." },
        },
      });
    if (data.action === "saveProfile") {
      state.name = data.name;
      state.phone = data.phone;
    }
    if (data.action === "saveAddress")
      state.addresses = [
        { ...data.address, id: "test-address", isDefault: true },
      ];
    if (data.action === "deleteAddress") state.addresses = [];
    return route.fulfill({
      json: {
        result:
          data.action === "orders"
            ? { orders: state.orders, cursor: null }
            : state,
      },
    });
  });
  return state;
}

for (const width of [1280, 390]) {
  test(`cadastro de cliente valida confirmação sem criar conta em ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    let authRequests = 0;
    await page.route(
      "https://identitytoolkit.googleapis.com/**",
      async (route) => {
        authRequests++;
        await route.abort();
      },
    );
    await page.goto("/cliente/cadastro");
    const form = page.getByRole("form", { name: "Cadastro do cliente" });
    await form.getByLabel("Seu nome", { exact: true }).fill("Maria Silva");
    await form.getByLabel("Telefone com DDD").fill("11999990000");
    await form
      .getByLabel("E-mail", { exact: true })
      .fill("cliente@example.com");
    await form.locator('[name="password"]').fill("senha-segura-123");
    await form.getByLabel("Confirme a senha").fill("senha-diferente");
    await form.getByRole("button", { name: "Mostrar", exact: true }).click();
    await expect(form.locator('[name="password"]')).toHaveAttribute(
      "type",
      "text",
    );
    await form.getByRole("button", { name: "Criar minha conta" }).click();
    await expect(form.getByRole("alert")).toHaveText("As senhas não conferem.");
    expect(authRequests).toBe(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}

test("login real no cliente, perfil, endereço, estado vazio e saída usam a sessão do cliente", async ({
  page,
}) => {
  const state = await mockCustomer(page);
  await page.goto("/cliente/login");
  await page.getByLabel("E-mail", { exact: true }).fill("cliente@example.com");
  await page.locator('[name="password"]').fill("senha-segura-123");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL("/cliente");
  await expect(
    page.getByRole("heading", { name: "Olá, Maria." }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Seu próximo pedido começa aqui." }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/customer-account-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/customer-account-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Meu perfil", exact: true }).click();
  await page.getByLabel("Seu nome", { exact: true }).fill("Maria Santos");
  await page.getByRole("button", { name: "Salvar perfil" }).click();
  await expect(page.getByRole("status")).toHaveText("Perfil salvo.");
  expect(state.name).toBe("Maria Santos");
  await page.getByRole("button", { name: "Endereços", exact: true }).click();
  for (const [name, value] of Object.entries({
    "Nome do endereço": "Casa",
    Rua: "Rua Um",
    Número: "10",
    Bairro: "Centro",
    Cidade: "São Paulo",
    "Estado (UF)": "SP",
    CEP: "01001000",
  }))
    await page.getByLabel(name, { exact: true }).fill(value);
  await page.getByRole("button", { name: "Salvar endereço" }).click();
  await expect(page.getByRole("status")).toHaveText("Endereço salvo.");
  await expect(page.getByText("Principal", { exact: true })).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Olá, Maria." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Sair da conta", exact: true })
    .click();
  await expect(page).toHaveURL("/cliente/login");
  await expect(
    page.getByRole("form", { name: "Login do cliente" }),
  ).toBeVisible();
});

test("cadastro cria identidade, salva o perfil e abre a conta", async ({
  page,
}) => {
  const state = await mockCustomer(page);
  await page.goto("/cliente/cadastro");
  await page.getByLabel("Seu nome", { exact: true }).fill("Ana Santos");
  await page.getByLabel("Telefone com DDD").fill("11988887777");
  await page.getByLabel("E-mail", { exact: true }).fill("cliente@example.com");
  await page.locator('[name="password"]').fill("senha-segura-123");
  await page.getByLabel("Confirme a senha").fill("senha-segura-123");
  await page.getByRole("button", { name: "Criar minha conta" }).click();
  await expect(page).toHaveURL("/cliente");
  await expect(page.getByRole("heading", { name: "Olá, Ana." })).toBeVisible();
  expect(state.phone).toBe("11988887777");
});

test("histórico mostra pedido real, detalhes e atualização do andamento", async ({
  page,
}) => {
  const state = await mockCustomer(page);
  state.orders = [
    {
      id: "web-real-order",
      storeName: "Restaurante de teste",
      slug: "loja-teste",
      createdAtMs: Date.now(),
      status: "new",
      payment: "cash",
      paymentStatus: "due_on_fulfillment",
      totalCents: 2590,
      shippingCents: 590,
      fulfillment: "delivery",
      address: "Rua Um, 10",
      notes: "Sem cebola",
      lines: [
        {
          productId: "burger",
          quantity: 1,
          groups: [],
          parts: [],
          name: "Burger",
          unitCents: 2000,
          totalCents: 2000,
          details: [],
        },
      ],
      cancellationReason: "",
    },
  ];
  await page.goto("/cliente/login");
  await page.getByLabel("E-mail", { exact: true }).fill("cliente@example.com");
  await page.locator('[name="password"]').fill("senha-segura-123");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByText("Recebido", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Ver detalhes" }).click();
  await expect(page.getByText("Rua Um, 10", { exact: true })).toBeVisible();
  state.orders[0].status = "preparing";
  await page.getByRole("button", { name: "Atualizar", exact: true }).click();
  await expect(page.getByText("Em preparo", { exact: true })).toBeVisible();
});

test("recuperação usa e-mail do Firebase e não revela se existe conta", async ({
  page,
}) => {
  let sent = false;
  await page.route(
    "https://identitytoolkit.googleapis.com/**",
    async (route) => {
      const request = route.request().postDataJSON();
      expect(request.requestType).toBe("PASSWORD_RESET");
      expect(request.email).toBe("cliente@example.com");
      sent = true;
      await route.fulfill({ json: { email: request.email } });
    },
  );
  await page.goto("/cliente/recuperar-senha");
  await page.getByLabel("E-mail").fill("cliente@example.com");
  await page.getByRole("button", { name: "Enviar instruções" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Se este e-mail tem uma conta",
  );
  expect(sent).toBe(true);
});
