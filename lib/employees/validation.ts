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
    ...(input.role === "courier"
      ? {
          phone: input.phone?.replace(/\D/g, "") ?? "",
          vehicle: input.vehicle ?? "motorcycle",
        }
      : {}),
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
  if (!["attendant", "manager", "courier", "waiter"].includes(input.role))
    return "Selecione um cargo válido.";
  if (
    input.role === "courier" &&
    !/^\d{10,11}$/.test(input.phone?.replace(/\D/g, "") ?? "")
  )
    return "Informe um telefone com DDD para o entregador.";
  if (
    input.role === "courier" &&
    !["motorcycle", "bicycle", "car", "foot"].includes(
      input.vehicle ?? "motorcycle",
    )
  )
    return "Selecione um veículo válido.";
  return "";
}
