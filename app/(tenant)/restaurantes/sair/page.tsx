import CompleteTenantLogout from "@/app/(tenant)/_components/complete-tenant-logout";
export const metadata = {
  title: "Encerrando acesso — Cardap",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <CompleteTenantLogout />;
}
