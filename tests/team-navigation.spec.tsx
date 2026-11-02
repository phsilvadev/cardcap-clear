import React from "react";
import { test, expect } from "@playwright/test";
import { renderToStaticMarkup } from "react-dom/server";
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import DashboardSidebar from "../app/(tenant)/_components/dashboard/dashboard-sidebar";
import OperationsProvider from "../app/(tenant)/_components/dashboard/operations-provider";
import { NextRequest } from "next/server";
import { proxy } from "../proxy";
function sidebar(path: string, enabled: boolean) {
  return renderToStaticMarkup(
    <PathnameContext.Provider value={path}>
      <AppRouterContext.Provider
        value={{} as React.ContextType<typeof AppRouterContext>}
      >
        <OperationsProvider
          storeId="owner"
          initial={{ salon: enabled, ownDelivery: enabled }}
        >
          <DashboardSidebar
            tenant={{ slug: "minha-loja", name: "Minha Loja" }}
          />
        </OperationsProvider>
      </AppRouterContext.Provider>
    </PathnameContext.Provider>,
  );
}
test("menu mantém entregas e salão sem duplicar funcionários em Equipe", () => {
  const html = sidebar("/dashboard/entregas", true);
  expect(html).toMatch(/href="\/dashboard\/entregas"[^>]*aria-current="page"/);
  expect(html).toContain('href="/dashboard/salao"');
  expect(html).toContain('href="/dashboard?view=settings"');
  expect(html).not.toContain('href="/dashboard/equipe"');
  expect(html).not.toContain('href="/dashboard/garcons"');
  expect(html).not.toContain('href="/dashboard/entregadores"');
});
test("configurações permanecem acessíveis com salão e entrega desabilitados", () => {
  const html = sidebar("/dashboard", false);
  expect(html).toContain('href="/dashboard?view=settings"');
  expect(html).not.toContain('href="/dashboard/equipe"');
  expect(html).not.toContain('href="/dashboard/entregas"');
  expect(html).not.toContain('href="/dashboard/salao"');
});
for (const path of ["/dashboard/equipe", "/dashboard/entregas"]) {
  test(`${path} exige sessão`, async () => {
    const response = await proxy(
      new NextRequest(`http://localhost${path}`, {
        headers: { host: "localhost" },
      }),
    );
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/restaurantes/login");
  });
}
