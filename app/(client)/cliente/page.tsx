import type { Metadata } from "next";
import CustomerAccount from "../_components/customer-account";
export const metadata: Metadata = {
  title: "Minha conta — Cardap",
  description: "Seu perfil, endereços, favoritos e pedidos no Cardap.",
};
export default function Page() {
  return <CustomerAccount />;
}
