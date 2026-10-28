import type { Metadata } from "next";
import "../../styles/listing.css";
import "../../styles/store.css";
import "../../styles/product.css";
import Content from "../../components/produto";

export const metadata: Metadata = {
  title: "Detalhe do produto — Cardap",
  description:
    "Veja os detalhes de um produto do cardápio demonstrativo do Cardap.",
};

export default function Page() {
  return <Content />;
}
