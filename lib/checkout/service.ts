"use client";
import { httpsCallable } from "firebase/functions";
import { getFirebaseFunctions, getFirebaseAuth } from "@/lib/firebase/client";
import type { ProductResult } from "./types";
export function checkoutCall<T>(
  action: string,
  values: Record<string, unknown>,
): Promise<T> {
  return httpsCallable<Record<string, unknown>, T>(
    getFirebaseFunctions(),
    "publicCheckout",
  )({ ...values, action }).then((result) => result.data);
}
export function checkoutPix(slug: string, requestId: string) {
  return httpsCallable<
    { slug: string; requestId: string },
    {
      qr: { encodedImage: string; payload: string; expirationDate: string };
      environment: string;
    }
  >(
    getFirebaseFunctions(),
    "publicCheckoutPix",
  )({ slug, requestId }).then((result) => result.data);
}
export async function getPublicProduct(
  slug: string,
  productId: string,
  preview: boolean,
) {
  if (preview) await getFirebaseAuth().authStateReady();
  return httpsCallable<Record<string, unknown>, ProductResult>(
    getFirebaseFunctions(),
    "publicStorefront",
  )({ action: "product", slug, productId, preview }).then(
    (result) => result.data,
  );
}
export function checkoutError(error: unknown) {
  const e = error as { code?: string; message?: string };
  return e.code?.startsWith("functions/") &&
    ![
      "functions/internal",
      "functions/unavailable",
      "functions/deadline-exceeded",
    ].includes(e.code) &&
    e.message
    ? e.message
    : "Não foi possível confirmar a operação. Confira sua conexão e tente o mesmo envio novamente.";
}
