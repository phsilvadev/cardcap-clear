import CompleteTenantLogin from "@/app/(tenant)/_components/complete-tenant-login";
export const metadata = {
  title: "Preparando seu acesso — Cardap",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <CompleteTenantLogin />;
}
