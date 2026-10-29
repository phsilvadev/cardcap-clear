import type { EmployeeInput } from "./types";
export function normalizeEmployee(input: EmployeeInput): EmployeeInput {
  return {
    name:
      typeof input.name === "string"
        ? input.name.trim().replace(/\s+/g, " ")
        : "",
    email:
      typeof input.email === "string" ? input.email.trim().toLowerCase() : "",
    role: input.role,
  };
}
export function validateEmployee(input: EmployeeInput): string {
  if (
    typeof input.name !== "string" ||
    input.name.trim().length < 3 ||
    input.name.length > 100
  )
    return "Informe um nome entre 3 e 100 caracteres.";
  if (
    typeof input.email !== "string" ||
    input.email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)
  )
    return "Informe um e-mail válido.";
  if (!["attendant", "manager"].includes(input.role))
    return "Selecione um cargo válido.";
  return "";
}
