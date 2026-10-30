"use client";
import { httpsCallable } from "firebase/functions";
import { getFirebaseFunctions, getFirebaseAuth } from "@/lib/firebase/client";
import type { StoreListing, StorefrontResult } from "./types";
export function listPublicStores(city: string, state: string, cursor?: string) {
  return httpsCallable<
    { action: string; city: string; state: string; cursor?: string },
    StoreListing
  >(
    getFirebaseFunctions(),
    "publicStorefront",
  )({ action: "list", city, state, ...(cursor ? { cursor } : {}) }).then(
    (result) => result.data,
  );
}
export async function getPublicStore(
  slug: string,
  preview: boolean,
  productCursor?: string,
) {
  if (preview) await getFirebaseAuth().authStateReady();
  return httpsCallable<
    { action: string; slug: string; preview: boolean; productCursor?: string },
    StorefrontResult
  >(
    getFirebaseFunctions(),
    "publicStorefront",
  )({
    action: "get",
    slug,
    preview,
    ...(productCursor ? { productCursor } : {}),
  }).then((result) => result.data);
}
export async function getPublicStoreSummary(slug: string, preview: boolean) {
  if (preview) await getFirebaseAuth().authStateReady();
  return httpsCallable<
    { action: string; slug: string; preview: boolean },
    Pick<StorefrontResult, "store" | "preview">
  >(
    getFirebaseFunctions(),
    "publicStorefront",
  )({ action: "summary", slug, preview }).then((result) => result.data);
}
export function isStoreUnavailable(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "functions/not-found"
  );
}
