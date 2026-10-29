export type EmployeeRole = "attendant" | "manager" | "courier";
export const employeeRoles: Record<EmployeeRole, string> = {
  attendant: "Atendente",
  manager: "Gerente",
  courier: "Entregador",
};
export type EmployeeInput = {
  name: string;
  email: string;
  role: EmployeeRole;
  phone?: string;
  vehicle?: import("@/lib/types").CourierVehicle;
};
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
