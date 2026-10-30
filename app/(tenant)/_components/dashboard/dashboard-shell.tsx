import TenantOrdersProvider from "../orders/tenant-orders-provider";
import OperationsProvider from "./operations-provider";
import type { StoreOperations } from "@/lib/operations";
import type { ReactNode } from "react";
import type { Tenant } from "@/lib/tenant";
import DashboardSidebar from "./dashboard-sidebar";
import DashboardHeader from "./dashboard-header";
import DashboardFooter from "./dashboard-footer";

export default function DashboardShell({
  tenant,
  children,
}: {
  tenant: Tenant & { uid: string; operations: StoreOperations };
  children: ReactNode;
}) {
  return (
    <OperationsProvider storeId={tenant.uid} initial={tenant.operations}>
      <TenantOrdersProvider storeId={tenant.uid} slug={tenant.slug}>
        <a href="#dashboard-main" className="sr-only focus:not-sr-only">
          Ir para o conteúdo
        </a>
        <div className="dashboard">
          <DashboardSidebar tenant={tenant} />
          <div className="dashboard-app">
            <DashboardHeader />
            <main id="dashboard-main" tabIndex={-1}>
              {children}
            </main>
            <DashboardFooter />
          </div>
        </div>
      </TenantOrdersProvider>
    </OperationsProvider>
  );
}
