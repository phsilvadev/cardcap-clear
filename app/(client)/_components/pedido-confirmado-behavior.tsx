"use client";
import Behavior from "@/components/behavior";
import initializeCheckout from "@/app/(client)/_lib/checkout-flow";
const initialize = () => initializeCheckout("pedido-confirmado");
export default function PageBehavior() {
  return <Behavior initialize={initialize} />;
}
