import BackToMenu from "@/app/(tenant)/_components/products/back-to-menu";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireTenant } from "@/app/(tenant)/_lib/require-tenant";
import ProductForm from "@/app/(tenant)/_components/products/product-form";
export const metadata: Metadata = { title: "Editar produto — Cardap" };
export default async function Page({
  params,
}: {
  params: Promise<{ tenant: string; productId: string }>;
}) {
  const { tenant: slug, productId } = await params;
  const tenant = await requireTenant(slug);
  if (!productId || productId.length > 1500 || productId.includes("/"))
    notFound();
  return (
    <>
      <BackToMenu />
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">Cardápio</p>
          <h1>Editar produto</h1>
          <p>Atualize os dados, a imagem e as opções do produto.</p>
        </div>
      </div>
      <ProductForm storeId={tenant.uid} productId={productId} />
    </>
  );
}
