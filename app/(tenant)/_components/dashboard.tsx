import type { Tenant } from "@/lib/tenant";
import PageBehavior from "@/app/(tenant)/_components/dashboard-behavior";
import DashboardOverview from "@/app/(tenant)/_components/dashboard/dashboard-overview";
import DashboardOrders from "@/app/(tenant)/_components/dashboard/dashboard-orders";
import DashboardSettings from "@/app/(tenant)/_components/dashboard/dashboard-settings";

export default function DashboardContent({
  tenant,
  storeId,
}: {
  tenant: Tenant;
  storeId?: string;
}) {
  return (
    <>
      <div className={"dashboard-heading"}>
        <div>
          <p className={"eyebrow"}>{"Sua loja. Seus resultados."}</p>
          <h1 id={"view-title"}>{"Tudo pronto para servir."}</h1>
          <p id={"view-description"}>
            {"Acompanhe os pedidos e cuide do seu restaurante."}
          </p>
        </div>
      </div>
      <DashboardOverview storeId={storeId} />
      <DashboardOrders tenantSlug={tenant.slug} storeId={storeId} />
      <DashboardSettings tenantSlug={tenant.slug} storeId={storeId} />
      <p
        id={"dashboard-feedback"}
        className={"flow-status"}
        role={"status"}
        aria-live={"polite"}
      ></p>
      <PageBehavior tenant={tenant} />
    </>
  );
}
