"use client";
import Behavior from "@/components/behavior";
import initializeCheckout from "@/app/(client)/_lib/checkout-flow";
const initialize = () => initializeCheckout("pagamento");
export default function PageBehavior() {
  return <Behavior initialize={initialize} />;
}
