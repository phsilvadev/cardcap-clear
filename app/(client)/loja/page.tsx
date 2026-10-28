import type { Metadata } from "next";
import "@/app/(client)/_styles/listing.css";
import "@/app/(client)/_styles/store.css";
import Content from "@/app/(client)/_components/loja";

export const metadata: Metadata = {
  title: "Detalhe da loja — Cardap",
  description: "Conheça a loja e explore seu cardápio demonstrativo no Cardap.",
};

export default function Page() {
  return <Content />;
}
