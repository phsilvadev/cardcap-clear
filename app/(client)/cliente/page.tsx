import type { Metadata } from "next";
import "@/styles/flow.css";
import "@/app/(client)/_styles/customer.css";
import Content from "@/app/(client)/_components/cliente";

export const metadata: Metadata = {
  title: "Minha conta — Cardap",
  description:
    "Sua área de cliente no Cardap: perfil, carrinhos e simulações de pedidos.",
};

export default function Page() {
  return <Content />;
}
