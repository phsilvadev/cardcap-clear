import type { Metadata } from "next";
import "@/app/(client)/_styles/listing.css";
import "@/app/(client)/_styles/store.css";
import "@/app/(client)/_styles/product.css";
import Content from "@/app/(client)/_components/produto";

export const metadata: Metadata = {
  title: "Detalhe do produto — Cardap",
  description:
    "Veja os detalhes de um produto do cardápio demonstrativo do Cardap.",
};

export default function Page() {
  return <Content />;
}
