import { test, expect } from "@playwright/test";
import {
  normalizeEmployee,
  validateEmployee,
} from "../lib/employees/validation";
import type { EmployeeRole } from "../lib/employees/types";
const valid = {
  name: "Maria Silva",
  email: "maria@example.com",
  role: "attendant" as const,
};
test("normaliza nome e e-mail antes de cadastrar", () => {
  expect(
    normalizeEmployee({
      ...valid,
      name: "  Maria   Silva  ",
      email: " MARIA@EXAMPLE.COM ",
    }),
  ).toEqual(valid);
});
test("aceita cargos de atendimento, gerência e entrega", () => {
  expect(validateEmployee(valid)).toBe("");
  expect(validateEmployee({ ...valid, role: "manager" })).toBe("");
  expect(
    validateEmployee({ ...valid, role: "owner" as EmployeeRole }),
  ).toContain("cargo");
});
test("rejeita nome e e-mail fora dos limites", () => {
  expect(validateEmployee({ ...valid, name: "AB" })).toContain("nome");
  expect(validateEmployee({ ...valid, name: "A".repeat(101) })).toContain(
    "nome",
  );
  expect(validateEmployee({ ...valid, email: "email-invalido" })).toContain(
    "e-mail",
  );
  expect(
    validateEmployee({ ...valid, email: "a".repeat(255) + "@example.com" }),
  ).toContain("e-mail");
});

test("entregador exige telefone e veículo válido no cadastro único", () => {
  expect(
    validateEmployee({
      ...valid,
      role: "courier",
      phone: "11999990000",
      vehicle: "bicycle",
    }),
  ).toBe("");
  expect(validateEmployee({ ...valid, role: "courier" })).toContain("telefone");
});
