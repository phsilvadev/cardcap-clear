import { redirect } from "next/navigation";
import { requireTenant } from "@/app/(tenant)/_lib/require-tenant";
import SalonPage from "@/app/(tenant)/_components/salon/salon-page";
export const metadata = { title: "Salão e contas — Cardap" };
export default async function Page({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const tenant = await requireTenant((await params).tenant);
  if (!tenant.operations.salon)
    redirect("/dashboard?view=settings&section=operations");
  return <SalonPage storeId={tenant.uid} />;
}
