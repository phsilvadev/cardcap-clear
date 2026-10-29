import type { Metadata } from "next";
import Content from "@/app/(tenant)/_components/dashboard";
import { requireTenant } from "@/app/(tenant)/_lib/require-tenant";

type Props = { params: Promise<{ tenant: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tenant: slug } = await params;
  const tenant = await requireTenant(slug);
  return {
    title: `${tenant.name} — Dashboard — Cardap`,
    description: `Painel demonstrativo de ${tenant.name}: pedidos, cardápio e configurações.`,
  };
}

export default async function Page({ params }: Props) {
  const { tenant: slug } = await params;
  const tenant = await requireTenant(slug);
  return <Content tenant={tenant} storeId={tenant.uid} />;
}
