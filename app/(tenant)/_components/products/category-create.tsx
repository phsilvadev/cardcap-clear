"use client";
import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import type { MenuCategory } from "@/lib/menu/category-types";
import { createCategory, menuError } from "@/lib/menu/service";
import ProductDialog from "./product-dialog";

export default function CategoryCreate({
  storeId,
  disabled,
  onCreated,
}: {
  storeId: string;
  disabled: boolean;
  onCreated: (category: MenuCategory) => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (saving) return;
    const name = String(
      new FormData(event.currentTarget).get("categoryName") ?? "",
    );
    setSaving(true);
    setError("");
    try {
      onCreated(await createCategory(storeId, name));
      setOpen(false);
    } catch (cause) {
      setError(menuError(cause));
    } finally {
      setSaving(false);
    }
  }
  return (
    <>
      <button
        type="button"
        className="button secondary"
        disabled={disabled}
        onClick={() => {
          setError("");
          setOpen(true);
        }}
      >
        Nova categoria
      </button>
      {mounted &&
        createPortal(
          <ProductDialog
            id="category-create"
            title="Nova categoria"
            open={open}
            onClose={() => setOpen(false)}
            preventClose={saving}
          >
            {open && (
              <form onSubmit={submit} className="dashboard-product-form">
                <label>
                  Nome da categoria
                  <input
                    name="categoryName"
                    required
                    minLength={2}
                    maxLength={60}
                    autoFocus
                    disabled={saving}
                    placeholder="Ex.: Pratos principais"
                  />
                </label>
                {error && <p role="alert">{error}</p>}
                <div className="dialog-actions">
                  <button
                    className="button secondary"
                    type="button"
                    disabled={saving}
                    onClick={() => setOpen(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="button primary"
                    disabled={saving}
                  >
                    {saving ? "Salvando…" : "Salvar categoria"}
                  </button>
                </div>
              </form>
            )}
          </ProductDialog>,
          document.body,
        )}
    </>
  );
}
