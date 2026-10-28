import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import "@/styles/flow.css";
import "@/app/(tenant)/_styles/dashboard.css";
import Content from "@/app/(tenant)/_components/dashboard";
import { resolveTenant } from "@/lib/tenant";

type Props = { params: Promise<{ tenant: string }> };

async function getTenant(params: Props["params"]) {
  const { tenant: slug } = await params;
  const tenant = resolveTenant((await headers()).get("host") ?? "");
  if (!tenant || tenant.slug !== slug) notFound();
  return tenant;
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
  return <Content tenant={tenant} />;
}
