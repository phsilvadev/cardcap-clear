"use client";
import { httpsCallable } from "firebase/functions";
import { getFirebaseAuth, getFirebaseFunctions } from "@/lib/firebase/client";
import type { DashboardOrder } from "@/lib/types";
export type PrintingConfiguration = {
  autoAccept: boolean;
  deviceId: string;
  deviceName: string;
};
export type PrintAttention = {
  id: string;
  orderId: string;
  state: "printing" | "uncertain";
  updatedAt: number;
};
export type OrdersPage = {
  orders: DashboardOrder[];
  cursor: string | null;
  printing: PrintingConfiguration;
  attention: PrintAttention[];
};
export async function orderOperation<T = { ok: boolean }>(
  storeId: string,
  action: string,
  fields: Record<string, unknown> = {},
): Promise<T> {
  const auth = getFirebaseAuth();
  await auth.authStateReady();
  if (auth.currentUser?.uid !== storeId)
    throw new Error("Entre com a conta do proprietário deste restaurante.");
  return (
    await httpsCallable<Record<string, unknown>, T>(
      getFirebaseFunctions(),
      "tenantOrderOperations",
    )({ ...fields, storeId, action })
  ).data;
}
export function orderError(error: unknown) {
  const code = (error as { code?: string })?.code;
  if (code === "functions/unauthenticated")
    return "Sua sessão expirou. Entre novamente.";
  if (code === "functions/permission-denied")
    return "Você não tem acesso aos pedidos deste restaurante.";
  if (code === "functions/aborted" || code === "functions/failed-precondition")
    return "O pedido, a reserva ou o computador responsável mudou. Atualize antes de continuar.";
  if (code === "functions/not-found")
    return "Pedido ou serviço não encontrado. Atualize e tente novamente.";
  return "Não foi possível atualizar os pedidos. Confira a conexão e tente novamente.";
}
