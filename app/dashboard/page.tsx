import type { Metadata } from "next";
import "../../styles/flow.css";
import "../../styles/dashboard.css";
import Content from "../../components/dashboard";

export const metadata: Metadata = {
  title: "Dashboard do restaurante — Cardap",
  description:
    "Painel demonstrativo do restaurante: pedidos, cardápio e configurações.",
};

export default function Page() {
  return <Content />;
}
