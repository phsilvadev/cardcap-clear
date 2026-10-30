"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { QueryDocumentSnapshot } from "firebase/firestore";
import {
  createEmployee,
  getEmployeeOwner,
  listEmployees,
  removeEmployee,
  generateEmployeeAccessLink,
  toggleEmployee,
  employeeError,
} from "@/lib/employees/service";
import type {
  Employee,
  EmployeeInput,
  EmployeeCredentials,
} from "@/lib/employees/types";

const empty: EmployeeInput = { name: "", email: "", role: "attendant" };
export function useEmployees(
  storeId: string | undefined,
  enabled: boolean,
  role?: EmployeeInput["role"],
) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [canManage, setCanManage] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const cursor = useRef<QueryDocumentSnapshot | undefined>(undefined);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const locked = useRef(false);
  const mounted = useRef(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [draft, setDraft] = useState<EmployeeInput>(empty);
  const [removing, setRemoving] = useState<Employee | null>(null);
  const [credentials, setCredentials] = useState<EmployeeCredentials | null>(
    null,
  );
  const [accessLink, setAccessLink] = useState<{
    name: string;
    link: string;
  } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    setAccessLink(null);
    if (!enabled) return;
    let cancelled = false;
    setLoading(true);
    setLoadError("");
    if (!storeId) {
      setLoading(false);
      setLoadError(
        "Não foi possível identificar a loja. Entre novamente com a conta do proprietário.",
      );
      return;
    }
    Promise.all([
      getEmployeeOwner(storeId),
      listEmployees(storeId, undefined, role),
    ])
      .then(([owner, page]) => {
        if (cancelled) return;
        setCanManage(owner.canManage);
        setEmployees(page.employees);
        cursor.current = page.cursor;
        setHasMore(page.hasMore);
      })
      .catch((cause) => {
        if (!cancelled) setLoadError(employeeError(cause));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [storeId, enabled, attempt, role]);
  const run = async (id: string, action: () => Promise<void>) => {
    if (locked.current || !storeId) return;
    locked.current = true;
    setBusy(id);
    setError("");
    setNotice("");
    try {
      await action();
    } catch (cause) {
      if (mounted.current) setError(employeeError(cause));
    } finally {
      locked.current = false;
      if (mounted.current) setBusy(null);
    }
  };
  const openForm = () => {
    setDraft({ ...empty });
    setError("");
    setFormOpen(true);
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canManage || !storeId) return;
    await run("create", async () => {
      const result = await createEmployee(storeId, draft);
      if (!mounted.current) return;
      setEmployees((items) => [
        result.employee,
        ...items.filter((item) => item.id !== result.employee.id),
      ]);
      setFormOpen(false);
      setDraft({ ...empty });
      setShowPassword(false);
      setCredentials(result.credentials);
      setNotice("Funcionário cadastrado.");
    });
  };
  const toggle = (employee: Employee) => {
    if (!canManage || !storeId) return;
    return run(employee.id, async () => {
      await toggleEmployee(storeId, employee.id, !employee.active);
      if (mounted.current) {
        setEmployees((items) =>
          items.map((item) =>
            item.id === employee.id
              ? { ...item, active: !employee.active }
              : item,
          ),
        );
        setNotice(
          employee.active ? "Funcionário desativado." : "Funcionário ativado.",
        );
      }
    });
  };
  const confirmRemove = () => {
    if (!removing || !canManage || !storeId) return;
    return run(removing.id, async () => {
      await removeEmployee(storeId, removing.id);
      if (mounted.current) {
        setEmployees((items) =>
          items.filter((item) => item.id !== removing.id),
        );
        setRemoving(null);
        setNotice("Vínculo do funcionário removido desta loja.");
      }
    });
  };
  const resend = (employee: Employee) => {
    if (!storeId || !canManage) return;
    return run(employee.id, async () => {
      const link = await generateEmployeeAccessLink(
        storeId,
        employee.id,
        employee.role,
      );
      if (mounted.current) {
        setAccessLink({ name: employee.name, link });
        if (employee.role === "courier" || employee.role === "waiter")
          setEmployees((items) =>
            items.map((item) =>
              item.id === employee.id ? { ...item, invited: true } : item,
            ),
          );
      }
    });
  };
  const loadMore = () => {
    if (!storeId) return;
    return run("more", async () => {
      const page = await listEmployees(storeId, cursor.current, role);
      if (mounted.current) {
        setEmployees((items) => [
          ...items,
          ...page.employees.filter(
            (employee) => !items.some((current) => current.id === employee.id),
          ),
        ]);
        cursor.current = page.cursor;
        setHasMore(page.hasMore);
      }
    });
  };
  const copyCredentials = async () => {
    if (!credentials) return;
    try {
      await navigator.clipboard.writeText(
        `E-mail: ${credentials.email}\nSenha temporária: ${credentials.password}`,
      );
      setNotice("Credenciais copiadas.");
    } catch {
      setError(
        "Não foi possível copiar. Selecione os dados e copie manualmente.",
      );
    }
  };
  const query = search.trim().toLocaleLowerCase("pt-BR");
  const visible = employees.filter(
    (employee) =>
      (status === "all" ||
        (status === "active" ? employee.active : !employee.active)) &&
      `${employee.name} ${employee.email}`
        .toLocaleLowerCase("pt-BR")
        .includes(query),
  );
  return {
    employees,
    visible,
    loading,
    loadError,
    canManage,
    hasMore,
    busy,
    error,
    notice,
    formOpen,
    draft,
    credentials,
    showPassword,
    search,
    setSearch,
    status,
    setStatus,
    retry: () => setAttempt((value) => value + 1),
    openForm,
    closeForm: () => {
      if (!locked.current) setFormOpen(false);
    },
    updateDraft: (fields: Partial<EmployeeInput>) => {
      setError("");
      setDraft((current) => ({ ...current, ...fields }));
    },
    submit,
    toggle,
    askRemove: (employee: Employee) => {
      setError("");
      setRemoving(employee);
    },
    removing,
    confirmRemove,
    cancelRemove: () => {
      if (!locked.current) setRemoving(null);
    },
    resend,
    accessLink,
    closeAccessLink: () => {
      setAccessLink(null);
      setError("");
      setNotice("");
    },
    copyAccessLink: async () => {
      if (!accessLink) return;
      try {
        await navigator.clipboard.writeText(accessLink.link);
        if (mounted.current) {
          setError("");
          setNotice("Link copiado.");
        }
      } catch {
        if (mounted.current)
          setError(
            "Não foi possível copiar. Selecione o link e copie manualmente.",
          );
      }
    },
    loadMore,
    copyCredentials,
    togglePassword: () => setShowPassword((value) => !value),
    clearCredentials: () => {
      setCredentials(null);
      setShowPassword(false);
      setError("");
    },
  };
}
