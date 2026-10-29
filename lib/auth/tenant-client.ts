"use client";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase/client";

export async function establishSession(user: User) {
  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken: await user.getIdToken(true) }),
  });
  if (!response.ok)
    throw new Error(
      "Conta sem acesso a este restaurante. Confira o cadastro e o endereço da loja.",
    );
}

async function ensureDomain(uid: string) {
  const db = getFirebaseDb();
  await runTransaction(db, async (transaction) => {
    const tenantRef = doc(db, "tenants", uid);
    const tenant = (await transaction.get(tenantRef)).data();
    if (!tenant || tenant.ownerUid !== uid)
      throw new Error("Cadastro do restaurante não encontrado.");
    if (tenant.slug) return;
    let base = tenant.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 45)
      .replace(/-$/, "");
    if (
      base.length < 3 ||
      ["www", "admin", "api", "app", "mail", "suporte", "parceiro"].includes(
        base,
      )
    )
      base = `loja-${base || "nova"}`;
    let slug = base;
    let domainRef = doc(db, "tenantDomains", slug);
    if ((await transaction.get(domainRef)).exists()) {
      slug = `${base}-${uid
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 12)}`;
      domainRef = doc(db, "tenantDomains", slug);
      if ((await transaction.get(domainRef)).exists())
        throw new Error("Não foi possível reservar o endereço da loja.");
    }
    transaction.set(domainRef, { tenantId: uid, createdAt: serverTimestamp() });
    transaction.update(tenantRef, { slug, updatedAt: serverTimestamp() });
  });
}

export async function registerRestaurant(input: {
  ownerName: string;
  storeName: string;
  email: string;
  password: string;
}) {
  const auth = getFirebaseAuth();
  const email = input.email.trim().toLowerCase();
  // An existing identity is reused only after checking its password.
  let user: User;
  try {
    user = (await createUserWithEmailAndPassword(auth, email, input.password))
      .user;
  } catch (error) {
    if (
      !(error instanceof FirebaseError) ||
      error.code !== "auth/email-already-in-use"
    )
      throw error;
    user = (await signInWithEmailAndPassword(auth, email, input.password)).user;
  }
  const ref = doc(getFirebaseDb(), "tenants", user.uid);
  await runTransaction(getFirebaseDb(), async (transaction) => {
    if (!(await transaction.get(ref)).exists())
      transaction.set(ref, {
        ownerUid: user.uid,
        ownerName: input.ownerName.trim(),
        name: input.storeName.trim(),
        status: "pending",
        createdAt: serverTimestamp(),
      });
  });
  await ensureDomain(user.uid);
  await establishSession(user);
}

export async function loginRestaurant(email: string, password: string) {
  const { user } = await signInWithEmailAndPassword(
    getFirebaseAuth(),
    email.trim(),
    password,
  );
  await ensureDomain(user.uid);
  await establishSession(user);
}

export async function logoutRestaurant() {
  const response = await fetch("/api/auth/session", { method: "DELETE" });
  if (!response.ok)
    throw new Error("Não foi possível encerrar a sessão. Tente novamente.");
  await signOut(getFirebaseAuth());
  window.location.replace("/restaurantes/login");
}

export function authMessage(error: unknown) {
  if (error instanceof FirebaseError) {
    const messages: Record<string, string> = {
      "auth/invalid-credential": "E-mail ou senha incorretos.",
      "auth/invalid-email": "Informe um e-mail válido.",
      "auth/weak-password":
        "Use uma senha mais forte, com pelo menos 8 caracteres.",
      "auth/too-many-requests":
        "Muitas tentativas. Aguarde antes de tentar novamente.",
      "auth/network-request-failed":
        "Não foi possível conectar ao Firebase. Tente novamente.",
      "auth/operation-not-allowed":
        "O acesso por e-mail e senha ainda não está habilitado.",
      "permission-denied":
        "Não foi possível acessar o cadastro da loja. Confira as permissões do Firebase. Se a conta já foi criada, repita o cadastro com o mesmo e-mail e senha.",
    };
    return (
      messages[error.code] ??
      "Não foi possível concluir o acesso. Tente novamente."
    );
  }
  return error instanceof Error &&
    [
      "Conta sem acesso",
      "Cadastro do restaurante",
      "Não foi possível reservar",
    ].some((prefix) => error.message.startsWith(prefix))
    ? error.message
    : "Não foi possível concluir o acesso. Tente novamente.";
}
