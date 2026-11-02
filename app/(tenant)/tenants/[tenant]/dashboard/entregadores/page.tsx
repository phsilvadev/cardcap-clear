import { redirect } from "next/navigation";
import { requireTenant } from "@/app/(tenant)/_lib/require-tenant";
export default async function Page({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  await requireTenant((await params).tenant);
  redirect("/dashboard?view=settings&section=employees&role=courier");
}
