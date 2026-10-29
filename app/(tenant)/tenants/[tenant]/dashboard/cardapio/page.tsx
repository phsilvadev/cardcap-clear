import type { Metadata } from "next";
import { requireTenant } from "@/app/(tenant)/_lib/require-tenant";
import ProductList from "@/app/(tenant)/_components/products/product-list";
export const metadata: Metadata = { title: "Cardápio — Cardap" };
export default async function Page({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const tenant = await requireTenant((await params).tenant);
  return (
    <>
      <div className="dashboard-heading mb-5">
        <div>
          <p className="eyebrow">Produtos do restaurante</p>
          <h1>Seu cardápio em dia.</h1>
          <p>
            Cadastre produtos e gerencie preços, categorias e disponibilidade.
          </p>
        </div>
      </div>
      <ProductList storeId={tenant.uid} />
    </>
  );
}
