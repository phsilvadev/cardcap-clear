import type { StoreOperations } from "@/lib/operations";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "cardap_session";
export type TenantSession = {
  uid: string;
  slug: string;
  name: string;
  status: string;
  operations: StoreOperations;
};

// Every check goes to Firebase. No trust is placed in client-provided claims.
export async function verifyTenantSession(
  token: string,
): Promise<TenantSession | null> {
  if (!token || token.length > 4096) return null;
  const key = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const project = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!key || !project) return null;
  try {
    const identity = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(key)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: token }),
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!identity.ok) return null;
    const { users } = await identity.json();
    const user = users?.[0];
    if (!user?.localId || user.disabled) return null;
    // Decoding is only used after Firebase has verified the token.
    const claims = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString(),
    );
    if (
      claims.aud !== project ||
      claims.iss !== `https://securetoken.google.com/${project}` ||
      claims.sub !== user.localId ||
      claims.exp <= Date.now() / 1000 ||
      claims.auth_time < Number(user.validSince ?? 0)
    )
      return null;
    const base = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(project)}/databases/(default)/documents`;
    const read = async (path: string) => {
      const response = await fetch(`${base}/${path}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      });
      return response.ok ? (await response.json()).fields : null;
    };
    const tenant = await read(`tenants/${encodeURIComponent(user.localId)}`);
    const slug = tenant?.slug?.stringValue;
    const status = tenant?.status?.stringValue;
    if (
      tenant?.ownerUid?.stringValue !== user.localId ||
      !/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(slug ?? "") ||
      !["pending", "configured", "active"].includes(status) ||
      typeof tenant.name?.stringValue !== "string"
    )
      return null;
    const domain = await read(`tenantDomains/${encodeURIComponent(slug)}`);
    if (domain?.tenantId?.stringValue !== user.localId) return null;
    return {
      uid: user.localId,
      slug,
      name: tenant.name.stringValue,
      status,
      operations: {
        salon:
          tenant.operations?.mapValue?.fields?.salon?.booleanValue === true,
        ownDelivery:
          tenant.operations?.mapValue?.fields?.ownDelivery?.booleanValue ===
          true,
      },
    };
  } catch {
    return null;
  }
}

export async function getTenantSession() {
  return verifyTenantSession(
    (await cookies()).get(SESSION_COOKIE)?.value ?? "",
  );
}
