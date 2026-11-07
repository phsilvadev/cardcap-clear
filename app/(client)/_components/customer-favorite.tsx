"use client";
import { useState } from "react";
import { useCustomer } from "@/lib/customer/use-customer";
import { customerCall, customerError } from "@/lib/customer/service";
import type { CustomerProfile } from "@/lib/customer/types";
import { getCustomerAuth } from "@/lib/firebase/client";
export default function CustomerFavorite({ slug }: { slug: string }) {
  const customer = useCustomer(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const saved =
    customer.profile?.favorites.some((item) => item.slug === slug) ?? false;
  async function toggle() {
    if (!customer.user) {
      window.location.assign(
        `/cliente/login?next=${encodeURIComponent(`/loja?store=${slug}`)}`,
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await customerCall<CustomerProfile>("favorite", {
        slug,
        remove: saved,
      });
      if (result.uid === getCustomerAuth().currentUser?.uid)
        customer.setProfile(result);
    } catch (reason) {
      setError(customerError(reason));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div style={{ marginTop: 15 }}>
      <button
        className="catalog-button"
        type="button"
        aria-pressed={saved}
        disabled={
          !customer.ready || busy || (!!customer.user && !customer.profile)
        }
        onClick={() => void toggle()}
      >
        {saved ? "♥ Salvo nos favoritos" : "♡ Salvar restaurante"}
      </button>
      {(error || customer.error) && (
        <p role="alert">{error || customer.error}</p>
      )}
    </div>
  );
}
