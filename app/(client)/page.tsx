import type { Metadata } from "next";
import Content from "@/app/(client)/_components/home";

export const metadata: Metadata = {
  title: "Cardap — Sua próxima refeição começa aqui",
  description:
    "Explore uma proposta visual do Cardap e escolha sua cidade para começar.",
};

export default function Page() {
  return <Content />;
}
