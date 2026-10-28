"use client";
import Behavior from "@/components/behavior";
import initialize from "@/app/(client)/_lib/restaurantes";
export default function PageBehavior() {
  return <Behavior initialize={initialize} />;
}
