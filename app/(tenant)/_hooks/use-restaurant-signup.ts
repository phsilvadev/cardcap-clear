"use client";

import { useState, type FormEvent } from "react";

export const useRestaurantSignup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState("");

  const togglePassword = () => setShowPassword((value) => !value);
  const clearStatus = () => setStatus("");
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(
      "Esta é uma prévia do cadastro. Nenhuma conta foi criada e nenhum dado foi enviado ou salvo.",
    );
  };

  return { showPassword, status, togglePassword, clearStatus, handleSubmit };
};
