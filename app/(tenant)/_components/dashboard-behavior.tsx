"use client";
import { useCallback } from "react";
import Behavior from "@/components/behavior";
import initializeDashboard from "@/app/(tenant)/_lib/dashboard";
import type { Tenant } from "@/lib/tenant";

export default function PageBehavior({ tenant }: { tenant: Tenant }) {
  const initialize = useCallback(
    () => initializeDashboard(tenant),
    [tenant.slug, tenant.name],
  );
  return <Behavior initialize={initialize} />;
}
