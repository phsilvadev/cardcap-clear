import type { Metadata } from "next";
import "../../styles/listing.css";
import "../../styles/store.css";
import Content from "../../components/loja";

export const metadata: Metadata = {
  title: "Detalhe da loja — Cardap",
  description: "Conheça a loja e explore seu cardápio demonstrativo no Cardap.",
};

export default function Page() {
  return <Content />;
}
