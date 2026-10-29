"use client";

import { useState, type FormEvent } from "react";
import { registerRestaurant, authMessage } from "@/lib/auth/tenant-client";

export const useRestaurantSignup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const togglePassword = () => setShowPassword((value) => !value);
  const clearStatus = () => setStatus("");
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    const data = new FormData(event.currentTarget);
    const ownerName = String(data.get("ownerName") ?? "").trim();
    const storeName = String(data.get("storeName") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    if (
      ownerName.length < 3 ||
      ownerName.length > 100 ||
      storeName.length < 3 ||
      storeName.length > 80
    ) {
      setStatus(
        "Informe seu nome e o nome do restaurante com pelo menos 3 caracteres.",
      );
      return;
    }
    if (password.length < 8 || password.length > 128) {
      setStatus("Use uma senha entre 8 e 128 caracteres.");
      return;
    }
    if (password !== data.get("confirmation")) {
      setStatus("As senhas não conferem.");
      return;
    }
    setLoading(true);
    setStatus("");
    try {
      await registerRestaurant({ ownerName, storeName, email, password });
      window.location.replace("/dashboard");
    } catch (error) {
      setStatus(authMessage(error));
    } finally {
      setLoading(false);
    }
  };
  return {
    showPassword,
    status,
    loading,
    togglePassword,
    clearStatus,
    handleSubmit,
  };
};
