import { test, expect } from "@playwright/test";

test("página em breve inscreve e informa o sucesso somente depois da resposta", async ({
  page,
}) => {
  let resolve: () => void = () => {};
  const pending = new Promise<void>((done) => {
    resolve = done;
  });
  let submissions = 0;
  await page.route("**/publicJoinWaitlist", async (route) => {
    const headers = {
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "*",
      "access-control-allow-methods": "POST,OPTIONS",
    };
    if (route.request().method() === "OPTIONS")
      return route.fulfill({ status: 204, headers });
    submissions++;
    expect(route.request().postDataJSON().data).toEqual({
      email: "parceiro@example.com",
      consent: true,
      website: "",
    });
    await pending;
    await route.fulfill({
      status: 200,
      headers,
      contentType: "application/json",
      body: JSON.stringify({ result: { accepted: true } }),
    });
  });
  await page.goto("/em-breve");
  await page.getByLabel("Seu melhor e-mail").fill("parceiro@example.com");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Quero fazer parte" }).click();
  await expect(
    page.getByRole("button", { name: "Inscrevendo…" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("heading", { name: "Você está na lista!" }),
  ).not.toBeVisible();
  resolve();
  await expect(
    page.getByRole("heading", { name: "Você está na lista!" }),
  ).toBeVisible();
  expect(submissions).toBe(1);
});

test("falha de inscrição permite tentar novamente sem afirmar sucesso", async ({
  page,
}) => {
  await page.route("**/publicJoinWaitlist", async (route) => {
    const headers = {
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "*",
      "access-control-allow-methods": "POST,OPTIONS",
    };
    if (route.request().method() === "OPTIONS")
      return route.fulfill({ status: 204, headers });
    await route.fulfill({
      status: 500,
      headers,
      contentType: "application/json",
      body: JSON.stringify({
        error: { status: "INTERNAL", message: "Unavailable" },
      }),
    });
  });
  await page.goto("/em-breve");
  await page.getByLabel("Seu melhor e-mail").fill("parceiro@example.com");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Quero fazer parte" }).click();
  await expect(
    page
      .getByRole("form", { name: "Receber novidades do Cardap" })
      .getByRole("alert"),
  ).toContainText("Não foi possível salvar");
  await expect(
    page.getByRole("button", { name: "Quero fazer parte" }),
  ).toBeEnabled();
  await expect(page.getByLabel("Seu melhor e-mail")).toHaveValue(
    "parceiro@example.com",
  );
  await expect(
    page.getByRole("heading", { name: "Você está na lista!" }),
  ).not.toBeVisible();
});
