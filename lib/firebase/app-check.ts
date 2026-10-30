"use client";
import type { FirebaseApp } from "firebase/app";
import {
  initializeAppCheck,
  getToken,
  ReCaptchaEnterpriseProvider,
  ReCaptchaV3Provider,
  type AppCheck,
} from "firebase/app-check";
const instances = new WeakMap<FirebaseApp, AppCheck>();
export function initializeWebAppCheck(app: FirebaseApp): AppCheck | null {
  const siteKey = process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY?.trim();
  if (typeof window === "undefined" || !siteKey) return null;
  const existing = instances.get(app);
  if (existing) return existing;
  const provider =
    process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_PROVIDER ?? "enterprise";
  if (!["enterprise", "v3"].includes(provider))
    throw new Error("Configuração da proteção contra robôs inválida.");
  const hostname = window.location.hostname;
  if (
    process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG === "true" &&
    (hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.endsWith(".localhost"))
  ) {
    (
      globalThis as typeof globalThis & {
        FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean;
      }
    ).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
  const instance = initializeAppCheck(app, {
    provider:
      provider === "v3"
        ? new ReCaptchaV3Provider(siteKey)
        : new ReCaptchaEnterpriseProvider(siteKey),
    isTokenAutoRefreshEnabled: true,
  });
  instances.set(app, instance);
  return instance;
}
export async function webAppCheckHeaders(
  app: FirebaseApp,
  forceRefresh = false,
): Promise<Record<string, string>> {
  const instance = initializeWebAppCheck(app);
  if (!instance) return {};
  try {
    const { token } = await getToken(instance, forceRefresh);
    return { "X-Firebase-AppCheck": token };
  } catch {
    throw new Error(
      "Não foi possível validar a proteção contra robôs. Atualize a página e tente novamente.",
    );
  }
}
