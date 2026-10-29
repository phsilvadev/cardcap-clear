"use client";
import { useEffect, useRef, type ReactNode } from "react";

export default function ProductDialog({
  id,
  title,
  open,
  onClose,
  children,
  preventClose = false,
}: {
  id: string;
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  preventClose?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open && !ref.current?.open) ref.current?.showModal();
    if (!open && ref.current?.open) ref.current.close();
  }, [open]);
  return (
    <dialog
      id={id}
      className="menu-dialog"
      ref={ref}
      aria-labelledby={`${id}-title`}
      onCancel={(event) => {
        event.preventDefault();
        if (!preventClose) onClose();
      }}
    >
      <div className="dialog-heading">
        <h2 id={`${id}-title`}>{title}</h2>
        <button
          type="button"
          className="text-button"
          onClick={onClose}
          disabled={preventClose}
          aria-label="Fechar formulário"
        >
          Fechar
        </button>
      </div>
      {children}
    </dialog>
  );
}
