import { getApps, initializeApp } from "firebase-admin/app";
import { getAppCheck } from "firebase-admin/app-check";
export const APP_CHECK_COOKIE = "cardap_app_check";
export type VerifiedAppCheck = { appId: string; expireTime: number };
export async function verifyWebAppCheck(
  token: string | null,
  verify?: (token: string) => Promise<{ app_id: string; exp: number }>,
): Promise<VerifiedAppCheck | null> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
  if (!projectId || !appId || !token || token.length > 8192) return null;
  try {
    const check =
      verify ??
      ((value: string) => {
        const name = "cardap-app-check-server";
        const app =
          getApps().find((app) => app.name === name) ??
          initializeApp({ projectId }, name);
        return getAppCheck(app)
          .verifyToken(value)
          .then((result) => result.token);
      });
    const claims = await check(token);
    if (
      claims.app_id !== appId ||
      !Number.isFinite(claims.exp) ||
      claims.exp <= Date.now() / 1000
    )
      return null;
    return { appId: claims.app_id, expireTime: claims.exp };
  } catch {
    return null;
  }
}
export const appCheckRequired = () =>
  process.env.FIREBASE_APPCHECK_ENFORCE === "true";
