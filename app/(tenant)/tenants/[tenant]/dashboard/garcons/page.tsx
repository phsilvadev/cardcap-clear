import { redirect } from "next/navigation";
import { requireTenant } from "@/app/(tenant)/_lib/require-tenant";
import WaitersPage from "@/app/(tenant)/_components/dashboard/waiters-page";
export const metadata = { title: "Garçons — Cardap" };
export default async function Page({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const tenant = await requireTenant((await params).tenant);
  if (!tenant.operations.salon)
    redirect("/dashboard?view=settings&section=operations");
  return <WaitersPage storeId={tenant.uid} />;
}
