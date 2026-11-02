import type { Metadata } from "next";
import "@/app/(client)/_styles/listing.css";
import "@/app/(client)/_styles/store.css";
import "@/app/(client)/_styles/product.css";
import "@/styles/flow.css";
import Content from "@/app/(client)/_components/produto";

export const metadata: Metadata = {
  title: "Detalhe do produto — Cardap",
  description: "Veja os detalhes de um produto do cardápio da loja no Cardap.",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ store?: string; product?: string; preview?: string }>;
}) {
  const params = await searchParams;
  return (
    <Content
      storeSlug={typeof params.store === "string" ? params.store : ""}
      productId={typeof params.product === "string" ? params.product : ""}
      preview={params.preview === "1"}
    />
  );
}
