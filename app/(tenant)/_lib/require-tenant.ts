import type { StoreOperations } from "@/lib/operations";
import { cache } from "react";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getTenantSession } from "@/lib/auth/session";
import { resolveTenant, type Tenant } from "@/lib/tenant";

// Shared within one server render; authorization is checked again on each request.
export const requireTenant = cache(
  async (
    slug: string,
  ): Promise<Tenant & { uid: string; operations: StoreOperations }> => {
    const session = await getTenantSession();
    if (!session) redirect("/restaurantes/login");
    const hostTenant = resolveTenant((await headers()).get("host") ?? "");
    if (session.slug !== slug || (hostTenant && hostTenant.slug !== slug))
      notFound();
    return {
      slug: session.slug,
      name: session.name,
      uid: session.uid,
      operations: session.operations,
    };
  },
);
