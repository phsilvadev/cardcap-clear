"use client";
import Behavior from "./behavior";
import initialize from "../lib/behaviors/produto";
export default function PageBehavior() {
  return <Behavior initialize={initialize} />;
}
