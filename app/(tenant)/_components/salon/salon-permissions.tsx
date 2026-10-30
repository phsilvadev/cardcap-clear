"use client";
import { useEffect, useState } from "react";
import { listEmployees } from "@/lib/employees/service";
import type { Employee } from "@/lib/employees/types";
export default function SalonPermissions({
  storeId,
  disabled,
  mutate,
}: {
  storeId: string;
  disabled: boolean;
  mutate: (action: string, fields: Record<string, unknown>) => Promise<boolean>;
}) {
  const [employees, setEmployees] = useState<Employee[]>([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [next, setNext] =
      useState<Awaited<ReturnType<typeof listEmployees>>["cursor"]>(),
    [more, setMore] = useState(false);
  async function load(cursor?: typeof next) {
    setLoading(true);
    try {
      const result = await listEmployees(storeId, cursor);
      setEmployees((current) =>
        cursor ? [...current, ...result.employees] : result.employees,
      );
      setNext(result.cursor);
      setMore(result.hasMore);
      setError("");
    } catch {
      setError("Não foi possível carregar a equipe. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, [storeId]);
  return (
    <section className="salon-permissions">
      <h2>Acesso ao caixa</h2>
      <p>
        Libere um atendente ou gerente ativo. O funcionário usa o próprio e-mail
        e senha em{" "}
        <a href="/equipe/salao" target="_blank" rel="noreferrer">
          /equipe/salao
        </a>
        . Garçons não registram pagamentos.
      </p>
      {error && <p role="alert">{error}</p>}
      {employees
        .filter((employee) => ["manager", "attendant"].includes(employee.role))
        .map((employee) => (
          <PermissionRow
            key={employee.id}
            employee={employee}
            disabled={disabled}
            save={(receivePayments, discounts) =>
              mutate("setPermissions", {
                employeeId: employee.id,
                receivePayments,
                discounts,
              })
            }
          />
        ))}
      {loading ? (
        <p role="status">Carregando equipe…</p>
      ) : more ? (
        <button className="button" onClick={() => void load(next)}>
          Carregar mais funcionários
        </button>
      ) : !employees.some((employee) =>
          ["manager", "attendant"].includes(employee.role),
        ) ? (
        <p>Cadastre um atendente ou gerente em Configurações → Funcionários.</p>
      ) : null}
    </section>
  );
}
function PermissionRow({
  employee,
  disabled,
  save,
}: {
  employee: Employee;
  disabled: boolean;
  save: (receive: boolean, discount: boolean) => Promise<boolean>;
}) {
  const [receive, setReceive] = useState(
      employee.salonPermissions?.receivePayments === true,
    ),
    [discount, setDiscount] = useState(
      employee.salonPermissions?.discounts === true,
    ),
    [saved, setSaved] = useState(false);
  return (
    <form
      className="salon-permission-row"
      onSubmit={(event) => {
        event.preventDefault();
        void save(receive, discount).then(setSaved);
      }}
    >
      <div>
        <strong>{employee.name}</strong>
        <p>
          {employee.email}
          {!employee.active ? " · Inativo" : ""}
        </p>
      </div>
      <label>
        <input
          type="checkbox"
          checked={receive}
          disabled={disabled || !employee.active}
          onChange={(event) => {
            setReceive(event.target.checked);
            setSaved(false);
          }}
        />
        Registrar pagamentos e encerrar contas
      </label>
      <label>
        <input
          type="checkbox"
          checked={discount}
          disabled={disabled || !employee.active}
          onChange={(event) => {
            setDiscount(event.target.checked);
            setSaved(false);
          }}
        />
        Aplicar descontos
      </label>
      <button className="button" disabled={disabled || !employee.active}>
        {saved ? "Permissões salvas" : "Salvar permissões"}
      </button>
    </form>
  );
}
