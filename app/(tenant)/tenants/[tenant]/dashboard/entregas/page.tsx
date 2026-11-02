import { redirect } from "next/navigation";
import { requireTenant } from "@/app/(tenant)/_lib/require-tenant";
import DeliveriesPage from "@/app/(tenant)/_components/deliveries/deliveries-page";
export const metadata = { title: "Entregas — Cardap" };
export default async function Page({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const tenant = await requireTenant((await params).tenant);
  if (!tenant.operations.ownDelivery)
    redirect("/dashboard?view=settings&section=operations");
  return <DeliveriesPage tenantSlug={tenant.slug} storeId={tenant.uid} />;
}
