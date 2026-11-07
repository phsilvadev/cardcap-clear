"use client";
import { FirebaseError } from "firebase/app";
import { httpsCallable } from "firebase/functions";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
} from "firebase/auth";
import { getCustomerAuth, getCustomerFunctions } from "@/lib/firebase/client";
import type { CustomerProfile } from "./types";
export async function customerCall<T>(
  action: string,
  values: Record<string, unknown> = {},
) {
  await getCustomerAuth().authStateReady();
  return (
    await httpsCallable<Record<string, unknown>, T>(
      getCustomerFunctions(),
      "customerOperations",
    )({ ...values, action })
  ).data;
}
export const loadCustomer = () => customerCall<CustomerProfile>("profile");
export async function loginCustomer(email: string, password: string) {
  await signInWithEmailAndPassword(getCustomerAuth(), email.trim(), password);
  return loadCustomer();
}
export async function registerCustomer(
  name: string,
  email: string,
  password: string,
  phone: string,
) {
  const { user } = await createUserWithEmailAndPassword(
    getCustomerAuth(),
    email.trim(),
    password,
  );
  await updateProfile(user, { displayName: name.trim() });
  const profile = await customerCall<CustomerProfile>("saveProfile", {
    name,
    phone,
  });
  await sendEmailVerification(user).catch(() => {});
  return profile;
}
export async function resetCustomerPassword(email: string) {
  await sendPasswordResetEmail(getCustomerAuth(), email.trim());
}
export async function verifyCustomerEmail() {
  const user = getCustomerAuth().currentUser;
  if (!user) throw Error("Entre novamente para confirmar seu e-mail.");
  await sendEmailVerification(user);
}
export async function logoutCustomer() {
  await signOut(getCustomerAuth());
  try {
    sessionStorage.removeItem("cardap-demo-user");
  } catch {
    /* Browser storage must not block sign-out. */
  }
  window.location.replace("/cliente/login");
}
export function customerError(error: unknown) {
  if (error instanceof FirebaseError) {
    const messages: Record<string, string> = {
      "auth/invalid-credential": "E-mail ou senha incorretos.",
      "auth/invalid-email": "Informe um e-mail válido.",
      "auth/email-already-in-use":
        "Este e-mail já tem uma conta. Entre ou recupere sua senha.",
      "auth/weak-password": "Use uma senha com pelo menos 8 caracteres.",
      "auth/too-many-requests": "Muitas tentativas. Aguarde alguns minutos.",
      "auth/network-request-failed":
        "Não foi possível conectar. Confira sua conexão.",
      "auth/operation-not-allowed":
        "O acesso por e-mail e senha não está habilitado no Firebase.",
      "auth/user-disabled":
        "Esta conta está desativada. Entre em contato com o suporte.",
      "auth/user-not-found": "E-mail ou senha incorretos.",
      "auth/wrong-password": "E-mail ou senha incorretos.",
      "functions/unauthenticated": "Sua sessão expirou. Entre novamente.",
    };
    if (messages[error.code]) return messages[error.code];
    if (
      error.code.startsWith("functions/") &&
      ![
        "functions/internal",
        "functions/unavailable",
        "functions/deadline-exceeded",
      ].includes(error.code)
    )
      return error.message;
  }
  return "Não foi possível concluir. Confira sua conexão e tente novamente.";
}
