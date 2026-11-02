import { cache } from "react";
import type { StoreOperations } from "@/lib/operations";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "cardap_session";
export const APP_CHECK_SESSION_COOKIE = "cardap_app_check";
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
  appCheckToken?: string,
): Promise<TenantSession | null> {
  if (!token || token.length > 4096) return null;
  const key = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const project = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!key || !project) return null;
  const started = performance.now();
  try {
    // Preliminary decoding selects a document path only. Both services still validate the token.
    const claims = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString(),
    );
    if (
      claims.aud !== project ||
      claims.iss !== `https://securetoken.google.com/${project}` ||
      typeof claims.sub !== "string" ||
      !/^[a-zA-Z0-9_-]{1,128}$/.test(claims.sub) ||
      !Number.isFinite(claims.exp) ||
      claims.exp <= Date.now() / 1000 ||
      !Number.isFinite(claims.auth_time)
    )
      return null;
    const base = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(project)}/databases/(default)/documents`;
    const read = async (path: string) => {
      const response = await fetch(`${base}/${path}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          ...(appCheckToken ? { "X-Firebase-AppCheck": appCheckToken } : {}),
        },
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      });
      return response.ok ? (await response.json()).fields : null;
    };
    // Firestore independently authorizes this read using the caller's token and the rules.
    const [identity, tenant] = await Promise.all([
      fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(key)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(appCheckToken ? { "X-Firebase-AppCheck": appCheckToken } : {}),
          },
          body: JSON.stringify({ idToken: token }),
          cache: "no-store",
          signal: AbortSignal.timeout(10000),
        },
      ),
      read(`tenants/${encodeURIComponent(claims.sub)}`),
    ]);
    if (!identity.ok) return null;
    const { users } = await identity.json();
    const user = users?.[0];
    if (!user?.localId || user.disabled) return null;
    if (
      claims.sub !== user.localId ||
      claims.auth_time < Number(user.validSince ?? 0)
    )
      return null;
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
  } finally {
    if (process.env.CARDAP_AUTH_TIMING === "true")
      console.info(
        JSON.stringify({
          event: "tenant-session-check",
          durationMs: Math.round(performance.now() - started),
        }),
      );
  }
}

export const getTenantSession = cache(async function getTenantSession() {
  const jar = await cookies();
  return verifyTenantSession(
    jar.get(SESSION_COOKIE)?.value ?? "",
    jar.get(APP_CHECK_SESSION_COOKIE)?.value,
  );
});
