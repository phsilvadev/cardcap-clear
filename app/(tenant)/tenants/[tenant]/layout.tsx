import type { ReactNode } from "react";
import "@/styles/flow.css";
import "@/app/(tenant)/_styles/dashboard.css";
import "@/app/(tenant)/_styles/products.css";
import DashboardShell from "@/app/(tenant)/_components/dashboard/dashboard-shell";
import { requireTenant } from "@/app/(tenant)/_lib/require-tenant";

type Props = {
  children: ReactNode;
  params: Promise<{ tenant: string }>;
};

export default async function TenantLayout({ children, params }: Props) {
  const { tenant: slug } = await params;
  const tenant = await requireTenant(slug);
  return <DashboardShell tenant={tenant}>{children}</DashboardShell>;
}
