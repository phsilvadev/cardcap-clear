"use client";
import { useState } from "react";
import { useEmployees } from "./use-employees";
export function useWaiters(storeId: string) {
  const team = useEmployees(storeId, true, "waiter");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const query = search.trim().toLocaleLowerCase("pt-BR");
  const waiters = team.employees.filter(
    (employee) => employee.role === "waiter",
  );
  return {
    ...team,
    search,
    setSearch,
    filter,
    setFilter,
    total: waiters.length,
    active: waiters.filter((employee) => employee.active).length,
    pending: waiters.filter((employee) => !employee.invited).length,
    visible: waiters.filter(
      (employee) =>
        (filter === "all" ||
          (filter === "active" && employee.active) ||
          (filter === "inactive" && !employee.active) ||
          (filter === "pending" && !employee.invited)) &&
        `${employee.name} ${employee.email}`
          .toLocaleLowerCase("pt-BR")
          .includes(query),
    ),
    clearFilters: () => {
      setSearch("");
      setFilter("all");
    },
  };
}
