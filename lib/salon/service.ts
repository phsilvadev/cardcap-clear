"use client";
import { httpsCallable } from "firebase/functions";
import { getFirebaseFunctions } from "@/lib/firebase/client";
export async function salonOperation<T>(
  action: string,
  values: Record<string, unknown> = {},
) {
  return (
    await httpsCallable<Record<string, unknown>, T>(
      getFirebaseFunctions(),
      "salonOperations",
    )({ ...values, action })
  ).data;
}
export function salonError(error: unknown) {
  const e = error as { code?: string; message?: string };
  return typeof e.code === "string" &&
    e.code.startsWith("functions/") &&
    typeof e.message === "string" &&
    ![
      "functions/internal",
      "functions/unavailable",
      "functions/deadline-exceeded",
    ].includes(e.code)
    ? e.message
    : "Não foi possível confirmar a operação. Confira sua conexão e tente novamente.";
}
export function uncertainSalonError(error: unknown) {
  return ![
    "functions/invalid-argument",
    "functions/failed-precondition",
    "functions/permission-denied",
    "functions/unauthenticated",
    "functions/not-found",
    "functions/already-exists",
    "functions/resource-exhausted",
  ].includes((error as { code?: string })?.code ?? "");
}
