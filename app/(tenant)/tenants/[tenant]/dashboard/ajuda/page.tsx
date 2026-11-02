import { supportWhatsAppPhone } from "@/lib/support";
import { requireTenant } from "@/app/(tenant)/_lib/require-tenant";
import HelpPage from "@/app/(tenant)/_components/help/help-page";
export const metadata = { title: "Ajuda e suporte — Cardap" };
export default async function Page({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const tenant = await requireTenant((await params).tenant);
  const phone = supportWhatsAppPhone();
  return <HelpPage storeName={tenant.name} phone={phone} />;
}
