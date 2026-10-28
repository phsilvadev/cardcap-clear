"use client";
import Behavior from "./behavior";
import initialize from "../lib/behaviors/cliente";
export default function PageBehavior() {
  return <Behavior initialize={initialize} />;
}
