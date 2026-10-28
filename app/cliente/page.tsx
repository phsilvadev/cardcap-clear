import type { Metadata } from "next";
import "../../styles/flow.css";
import "../../styles/customer.css";
import Content from "../../components/cliente";

export const metadata: Metadata = {
  title: "Minha conta — Cardap",
  description:
    "Sua área de cliente no Cardap: perfil, carrinhos e simulações de pedidos.",
};

export default function Page() {
  return <Content />;
}
