"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { getCustomerAuth } from "@/lib/firebase/client";
export default function CustomerHomeLink() {
  const [loggedIn, setLoggedIn] = useState(false);
  useEffect(() => {
    try {
      return onAuthStateChanged(getCustomerAuth(), (user) =>
        setLoggedIn(!!user),
      );
    } catch {
      return;
    }
  }, []);
  return (
    <a href={loggedIn ? "/cliente" : "/cliente/login"}>
      {loggedIn ? "Minha conta" : "Área do cliente"}
    </a>
  );
}
