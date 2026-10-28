"use client";
import Behavior from "./behavior";
import initializeCheckout from "../lib/behaviors/checkout-flow";
const initialize = () => initializeCheckout("carrinho");
export default function PageBehavior() {
  return <Behavior initialize={initialize} />;
}
