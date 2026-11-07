import { Suspense } from "react";
import type { Metadata } from "next";
import CustomerAccess from "../../_components/customer-access";
export const metadata: Metadata = { title: "Recuperar senha — Cardap" };
export default function Page() {
  return (
    <Suspense fallback={<p role="status">Carregando…</p>}>
      <CustomerAccess mode="reset" />
    </Suspense>
  );
}
