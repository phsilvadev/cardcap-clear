import { requireTenant } from "@/app/(tenant)/_lib/require-tenant";
import DashboardOrders from "@/app/(tenant)/_components/dashboard/dashboard-orders";
export const metadata = { title: "Pedidos — Cardap" };
export default async function Page({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const tenant = await requireTenant((await params).tenant);
  return (
    <DashboardOrders tenantSlug={tenant.slug} storeId={tenant.uid} />
  );
}
