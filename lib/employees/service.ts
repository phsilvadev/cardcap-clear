"use client";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  startAfter,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import {
  getFirebaseAuth,
  getFirebaseDb,
  getFirebaseFunctions,
} from "@/lib/firebase/client";
import type { Employee, EmployeeInput, EmployeeCredentials } from "./types";
import { normalizeEmployee, validateEmployee } from "./validation";

export async function getEmployeeOwner(storeId: string) {
  const auth = getFirebaseAuth();
  await auth.authStateReady();
  if (!storeId || auth.currentUser?.uid !== storeId)
    throw new Error(
      "Entre com a conta do proprietário para gerenciar a equipe.",
    );
  const tenant = (
    await getDoc(doc(getFirebaseDb(), "tenants", storeId))
  ).data();
  if (
    !tenant ||
    tenant.ownerUid !== storeId ||
    !["pending", "configured", "active"].includes(tenant.status)
  )
    throw new Error("Você não tem acesso à equipe desta loja.");
  return { canManage: ["configured", "active"].includes(tenant.status) };
}
async function requireManagement(storeId: string) {
  if (!(await getEmployeeOwner(storeId)).canManage)
    throw new Error(
      "Conclua o cadastro da loja antes de gerenciar os funcionários.",
    );
}
export async function listEmployees(
  storeId: string,
  cursor?: QueryDocumentSnapshot,
) {
  await getEmployeeOwner(storeId);
  const snapshot = await getDocs(
    query(
      collection(getFirebaseDb(), "tenants", storeId, "employees"),
      orderBy("createdAt", "desc"),
      ...(cursor ? [startAfter(cursor)] : []),
      limit(50),
    ),
  );
  const employees: Employee[] = snapshot.docs.map((item) => {
    const data = item.data();
    const fields = { name: data.name, email: data.email, role: data.role };
    if (
      data.storeId !== storeId ||
      validateEmployee(fields) ||
      typeof data.active !== "boolean"
    )
      throw new Error("Não foi possível carregar os dados da equipe.");
    return {
      ...fields,
      id: item.id,
      active: data.active,
      invited: data.invited === true,
    };
  });
  return {
    employees,
    cursor: snapshot.docs.at(-1),
    hasMore: snapshot.size === 50,
  };
}
export async function createEmployee(
  storeId: string,
  input: EmployeeInput,
): Promise<{ employee: Employee; credentials: EmployeeCredentials | null }> {
  const fields = normalizeEmployee(input);
  const error = validateEmployee(fields);
  if (error) throw new Error(error);
  await requireManagement(storeId);
  const invite = httpsCallable<
    { storeId: string } & EmployeeInput,
    { employeeId: string; tempPassword?: string }
  >(getFirebaseFunctions(), "employeeInvite");
  const { data } = await invite({ storeId, ...fields });
  if (
    !data ||
    typeof data.employeeId !== "string" ||
    !data.employeeId ||
    data.employeeId.includes("/")
  )
    throw new Error(
      "Não foi possível confirmar o cadastro. Atualize a listagem antes de tentar novamente.",
    );
  return {
    employee: { ...fields, id: data.employeeId, active: true, invited: true },
    credentials:
      typeof data.tempPassword === "string" &&
      data.tempPassword.length > 0 &&
      data.tempPassword.length <= 256
        ? {
            name: fields.name,
            email: fields.email,
            password: data.tempPassword,
          }
        : null,
  };
}
export async function toggleEmployee(
  storeId: string,
  employeeId: string,
  active: boolean,
) {
  await requireManagement(storeId);
  await updateDoc(
    doc(getFirebaseDb(), "tenants", storeId, "employees", employeeId),
    { active, updatedAt: serverTimestamp() },
  );
}
export async function removeEmployee(storeId: string, employeeId: string) {
  await requireManagement(storeId);
  await deleteDoc(
    doc(getFirebaseDb(), "tenants", storeId, "employees", employeeId),
  );
}
export async function resendEmployeeAccess(storeId: string, email: string) {
  await requireManagement(storeId);
  const invite = httpsCallable<{ storeId: string; email: string }, unknown>(
    getFirebaseFunctions(),
    "employeeResendInvite",
  );
  await invite({ storeId, email });
}
export function employeeError(error: unknown): string {
  const code = (error as { code?: string })?.code;
  const messages: Record<string, string> = {
    "permission-denied": "Você não tem permissão para gerenciar esta equipe.",
    "functions/permission-denied":
      "A operação foi recusada. Confira seu acesso e o cadastro da loja.",
    "functions/unauthenticated":
      "Sua sessão expirou. Entre novamente com a conta do proprietário.",
    "functions/already-exists":
      "Este e-mail já possui um cadastro. Confira a lista antes de tentar novamente.",
    "functions/invalid-argument":
      "Confira o nome, o e-mail e o cargo do funcionário.",
    "functions/not-found":
      "O serviço de funcionários não está disponível. Tente novamente mais tarde.",
    "functions/unavailable":
      "Não foi possível conectar ao serviço de funcionários. Tente novamente.",
    "functions/deadline-exceeded":
      "A operação demorou mais que o esperado. Atualize a lista antes de tentar novamente.",
    unavailable: "Não foi possível conectar ao Firebase. Tente novamente.",
  };
  if (code)
    return (
      messages[code] ??
      "Não foi possível concluir a operação com a equipe. Tente novamente."
    );
  if (error instanceof TypeError)
    return "Não foi possível conectar ao serviço. Tente novamente.";
  return error instanceof Error
    ? error.message
    : "Não foi possível concluir a operação.";
}
