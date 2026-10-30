import { requireTenant } from "@/app/(tenant)/_lib/require-tenant";
import HelpPage from "@/app/(tenant)/_components/help/help-page";
export const metadata = { title: "Ajuda e suporte — Cardap" };
export default async function Page({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const tenant = await requireTenant((await params).tenant);
  const raw = process.env.CARDAP_SUPPORT_WHATSAPP || "5586995747604";
  const phone = raw.replace(/\D/g, "");
  return (
    <HelpPage
      storeName={tenant.name}
      phone={/^\d{10,15}$/.test(phone) ? phone : null}
    />
  );
}
