import { redirect } from "next/navigation";
import { requireTenant } from "@/app/(tenant)/_lib/require-tenant";
import { employeeRoles } from "@/lib/employees/types";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ role?: string }>;
}) {
  await requireTenant((await params).tenant);
  const { role } = await searchParams;
  const destination = new URLSearchParams({
    view: "settings",
    section: "employees",
  });
  if (role && Object.hasOwn(employeeRoles, role)) destination.set("role", role);
  redirect(`/dashboard?${destination}`);
}
