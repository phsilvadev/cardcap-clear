import BackToMenu from "@/app/(tenant)/_components/products/back-to-menu";
import type { Metadata } from "next";
import { requireTenant } from "@/app/(tenant)/_lib/require-tenant";
import ProductForm from "@/app/(tenant)/_components/products/product-form";
export const metadata: Metadata = { title: "Cadastrar produto — Cardap" };
export default async function Page({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const tenant = await requireTenant((await params).tenant);
  return (
    <>
      <BackToMenu />
      <div className="dashboard-heading ">
        <div>
          <p className="eyebrow">Cardápio</p>
          <h1>Cadastrar produto</h1>
          <p>Preencha os dados e as opções do novo produto.</p>
        </div>
      </div>
      <ProductForm storeId={tenant.uid} />
    </>
  );
}
