import type { Metadata } from "next";
import "@/app/(client)/_styles/listing.css";
import Content from "@/app/(client)/_components/restaurantes";

export const metadata: Metadata = {
  title: "Restaurantes da sua região — Cardap",
  description: "Explore a prévia de restaurantes por região do Cardap.",
};

export default function Page() {
  return <Content />;
}
