"use client";
import Behavior from "./behavior";
import initialize from "../lib/behaviors/home";
export default function PageBehavior() {
  return <Behavior initialize={initialize} />;
}
