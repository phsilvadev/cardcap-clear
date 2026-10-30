"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  normalizeSection,
  type StoreProfileSection,
} from "@/firebase/employee-access/store-profile-schema.cjs";
import { storeSettingsValues } from "@/lib/store-profile/form-values";
import { useStoreSettings } from "../_components/settings/store-settings-provider";
export function useStoreSettingsForm(section: StoreProfileSection) {
  const store = useStoreSettings();
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const dirty = useRef(false);
  const locked = useRef(false);
  useEffect(() => {
    if (!store.data) {
      dirty.current = false;
      setValues({});
      return;
    }
    if (dirty.current) return;
    setValues(storeSettingsValues(section, store.data));
  }, [store.data, section]);
  const change = (field: string, value: string | boolean) => {
    dirty.current = true;
    setError("");
    setValues((current) => ({ ...current, [field]: value }));
  };
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (locked.current || !store.data) return;
    const normalized = normalizeSection(section, values);
    if (normalized.issues.length) {
      setError(`Confira: ${normalized.issues.join("; ")}.`);
      return;
    }
    locked.current = true;
    setSaving(true);
    setError("");
    try {
      await store.save(section, values);
      dirty.current = false;
      setSuccess(true);
    } catch (cause) {
      const code = (cause as { code?: string }).code;
      setError(
        [
          "functions/invalid-argument",
          "functions/failed-precondition",
        ].includes(code || "") && (cause as Error).message
          ? (cause as Error).message
          : "Não foi possível salvar. Confira sua conexão e tente novamente.",
      );
    } finally {
      locked.current = false;
      setSaving(false);
    }
  }
  const canEdit = Boolean(
    store.data &&
    ["pending", "configured", "active"].includes(String(store.data.status)) &&
    !(section === "wallet" && store.data.status === "active"),
  );
  return {
    values,
    change,
    submit,
    saving,
    loading: store.loading,
    error: error || store.error,
    canEdit,
    success,
    closeSuccess: () => setSuccess(false),
    walletLocked: section === "wallet" && store.data?.status === "active",
  };
}
