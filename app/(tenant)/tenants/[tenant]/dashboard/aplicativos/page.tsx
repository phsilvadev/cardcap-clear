import { requireTenant } from "@/app/(tenant)/_lib/require-tenant";
import AppsHub from "@/app/(tenant)/_components/apps/apps-hub";
export const metadata = { title: "Aplicativos Cardap — Cardap" };
function installUrl(value?: string) {
  try {
    const url = new URL(value || "");
    return url.protocol === "https:" && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}
export default async function Page({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  await requireTenant((await params).tenant);
  return (
    <AppsHub
      links={{
        waiter: installUrl(process.env.CARDAP_WAITER_APP_URL),
        courier: installUrl(process.env.CARDAP_COURIER_APP_URL),
        printing: installUrl(process.env.CARDAP_PRINT_APP_URL),
      }}
    />
  );
}
