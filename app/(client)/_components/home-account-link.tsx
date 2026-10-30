"use client";

import { useEffect, useState } from "react";
import type { Customer } from "@/lib/types";

type Account = { name: string; href: string };

export default function HomeAccountLink({
  restaurant,
}: {
  restaurant?: Account;
}) {
  const [customer, setCustomer] = useState<Account>();
  useEffect(() => {
    const update = () => {
      try {
        const user: Customer | null = JSON.parse(
          sessionStorage.getItem("cardap-demo-user") ?? "null",
        );
        setCustomer(
          user?.id === "demo-customer" &&
            user.demo === true &&
            typeof user.name === "string" &&
            user.name.trim() &&
            typeof user.email === "string"
            ? { name: user.name.trim().slice(0, 100), href: "/cliente" }
            : undefined,
        );
      } catch {
        setCustomer(undefined);
      }
    };
    update();
    window.addEventListener("pageshow", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("pageshow", update);
      window.removeEventListener("storage", update);
    };
  }, []);
  const account = restaurant ?? customer;
  const arrow = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 7h10v10M7 17 17 7" />
    </svg>
  );
  if (account)
    return (
      <a
        href={account.href}
        className="flex items-center gap-2 rounded-full border border-ink bg-white px-5 py-3 text-ink"
        aria-label={`Olá, ${account.name}. ${restaurant ? "Acessar painel do restaurante" : "Acessar minha conta"}`}
      >
        <span className="truncate" style={{ maxWidth: 200 }}>
          Olá, {account.name}
        </span>
        {arrow}
      </a>
    );
  return (
    <button
      type="button"
      className="flex items-center gap-2 rounded-full border border-ink bg-ink px-5 py-3 text-white hover:bg-white hover:text-ink"
      onClick={() => {
        const dialog = document.getElementById(
          "info-dialog",
        ) as HTMLDialogElement | null;
        const title = document.getElementById("dialog-title");
        const description = document.getElementById("dialog-description");
        if (title) title.textContent = "Entrar no Cardap";
        if (description)
          description.textContent =
            "Este HTML demonstra a nova identidade visual. O acesso à conta não está conectado nesta prévia.";
        dialog?.showModal();
      }}
    >
      Entrar {arrow}
    </button>
  );
}
