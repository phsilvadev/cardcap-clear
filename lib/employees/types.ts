export type EmployeeRole = "attendant" | "manager" | "courier" | "waiter";
export const employeeRoles: Record<EmployeeRole, string> = {
  attendant: "Atendente",
  manager: "Gerente",
  courier: "Entregador",
  waiter: "Garçom",
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
  salonPermissions?: { receivePayments: boolean; discounts: boolean };
};
export type EmployeeCredentials = {
  name: string;
  email: string;
  password: string;
};
