import type { Metadata } from "next";
import "../../styles/listing.css";
import Content from "../../components/restaurantes";

export const metadata: Metadata = {
  title: "Restaurantes da sua região — Cardap",
  description: "Explore a prévia de restaurantes por região do Cardap.",
};

export default function Page() {
  return <Content />;
}
