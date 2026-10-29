import type { Metadata } from "next";
import { requireTenant } from "@/app/(tenant)/_lib/require-tenant";
import CouriersPage from "@/app/(tenant)/_components/couriers/couriers-page";
export const metadata: Metadata = { title: "Entregadores — Cardap" };
export default async function Page({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const tenant = await requireTenant((await params).tenant);
  return <CouriersPage tenantSlug={tenant.slug} storeId={tenant.uid} />;
}
