import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import "@/styles/flow.css";
import "@/app/(tenant)/_styles/dashboard.css";
import Content from "@/app/(tenant)/_components/dashboard";
import { resolveTenant } from "@/lib/tenant";
import { getTenantSession } from "@/lib/auth/session";
import TenantSessionControls from "@/app/(tenant)/_components/tenant-session-controls";

type Props = { params: Promise<{ tenant: string }> };

async function getTenant(params: Props["params"]) {
  const { tenant: slug } = await params;
  const session = await getTenantSession();
  if (!session) redirect("/restaurantes/login");
  const hostTenant = resolveTenant((await headers()).get("host") ?? "");
  if (session.slug !== slug || (hostTenant && hostTenant.slug !== slug))
    notFound();
  return { slug: session.slug, name: session.name };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tenant = await getTenant(params);
  return {
    title: `${tenant.name} — Dashboard — Cardap`,
    description: `Painel demonstrativo de ${tenant.name}: pedidos, cardápio e configurações.`,
  };
}

export default async function Page({ params }: Props) {
  const tenant = await getTenant(params);
  return (
    <>
      <TenantSessionControls />
      <Content tenant={tenant} />
    </>
  );
}
