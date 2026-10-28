"use client";
import Behavior from "./behavior";
import initialize from "../lib/behaviors/dashboard";
export default function PageBehavior() {
  return <Behavior initialize={initialize} />;
}
