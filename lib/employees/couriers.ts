import type { Employee } from "./types";
import type { DeliveryCourier } from "@/lib/types";
export const courierVehicles = {
  motorcycle: "Moto",
  bicycle: "Bicicleta",
  car: "Carro",
  foot: "A pé",
} as const;
export function employeeCouriers(
  employees: Employee[],
  current: DeliveryCourier[],
): DeliveryCourier[] {
  return employees
    .filter((employee) => employee.role === "courier" && employee.active)
    .map((employee) => ({
      id: employee.id,
      name: employee.name,
      phone: employee.phone ?? "",
      vehicle: employee.vehicle ?? "motorcycle",
      available:
        current.find((courier) => courier.id === employee.id)?.available ??
        true,
    }));
}
