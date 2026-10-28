import type { Metadata } from "next";
import "../../styles/flow.css";
import Content from "../../components/pagamento";

export const metadata: Metadata = {
  title: "Escolha como pagar — Cardap",
  description:
    "Explore uma proposta visual do Cardap e escolha sua cidade para começar.",
};

export default function Page() {
  return <Content />;
}
