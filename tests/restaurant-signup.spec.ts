import { expect, test } from "@playwright/test";

for (const width of [1280, 375]) {
  test(`cadastro visual do restaurante em ${width}px, sem envio de dados`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/restaurantes/login");
    await page
      .getByRole("link", { name: "Cadastrar restaurante", exact: true })
      .click();
    await expect(page).toHaveURL("/restaurantes/cadastro");
    await expect(page).toHaveTitle("Cadastrar restaurante — Cardap");
    await page.getByLabel("Seu nome", { exact: true }).fill("Maria Silva");
    await page
      .getByLabel("Nome do restaurante", { exact: true })
      .fill("Restaurante de exemplo");
    await page
      .getByLabel("E-mail", { exact: true })
      .fill("exemplo@example.com");
    await page.getByLabel("Senha", { exact: true }).fill("senha-de-exemplo");
    await page
      .getByLabel("Confirme a senha", { exact: true })
      .fill("outra-senha-de-exemplo");
    await page
      .getByRole("button", { name: "Mostrar senhas", exact: true })
      .click();
    await expect(page.locator("#signup-password")).toHaveAttribute(
      "type",
      "text",
    );
    await expect(page.locator("#signup-confirmation")).toHaveAttribute(
      "type",
      "text",
    );
    await page
      .getByRole("button", { name: "Ocultar senhas", exact: true })
      .click();
    await expect(page.locator("#signup-password")).toHaveAttribute(
      "type",
      "password",
    );
    await expect(page.locator("#signup-confirmation")).toHaveAttribute(
      "type",
      "password",
    );
    const requests: string[] = [];
    page.on("request", (request) => requests.push(request.url()));
    await page
      .getByRole("button", { name: "Cadastrar restaurante", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText(
      "Nenhuma conta foi criada",
    );
    expect(requests).toEqual([]);
    expect(
      await page.evaluate(() => ({
        local: localStorage.length,
        session: sessionStorage.length,
      })),
    ).toEqual({ local: 0, session: 0 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.getByRole("link", { name: "Entrar", exact: true }).click();
    await expect(page).toHaveURL("/restaurantes/login");
  });
}
