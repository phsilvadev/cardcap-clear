import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Content from "@/app/(tenant)/_components/dashboard";
import { requireTenant } from "@/app/(tenant)/_lib/require-tenant";

type Props = {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tenant: slug } = await params;
  const tenant = await requireTenant(slug);
  return {
    title: `${tenant.name} — Dashboard — Cardap`,
    description: `Painel demonstrativo de ${tenant.name}: pedidos, cardápio e configurações.`,
  };
}

export default async function Page({ params, searchParams }: Props) {
  const { tenant: slug } = await params;
  const tenant = await requireTenant(slug);
  const search = await searchParams;
  if (search.view === "orders") {
    const query = new URLSearchParams();
    for (const key of ["pedido", "status"])
      if (typeof search[key] === "string")
        query.set(key, search[key] as string);
    redirect(`/dashboard/pedidos${query.size ? `?${query}` : ""}`);
  }
  return <Content tenant={tenant} storeId={tenant.uid} />;
}
