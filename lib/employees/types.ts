export type EmployeeRole = "attendant" | "manager";
export const employeeRoles: Record<EmployeeRole, string> = {
  attendant: "Atendente",
  manager: "Gerente",
};
export type EmployeeInput = { name: string; email: string; role: EmployeeRole };
export type Employee = EmployeeInput & {
  id: string;
  active: boolean;
  invited: boolean;
};
export type EmployeeCredentials = {
  name: string;
  email: string;
  password: string;
};
