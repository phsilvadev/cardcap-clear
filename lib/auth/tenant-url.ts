import { resolveTenant } from "@/lib/tenant";
export function tenantDashboardUrl(
  origin: string,
  slug: string,
  path = "/dashboard",
) {
  if (
    !/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(slug) ||
    !["/dashboard", "/dashboard/pedidos"].includes(path)
  )
    throw new Error("Destino do restaurante inválido.");
  const url = new URL(origin);
  const tenant = resolveTenant(url.host);
  if (tenant && tenant.slug !== slug)
    throw new Error("Conta sem acesso a este restaurante.");
  if (["localhost", "127.0.0.1"].includes(url.hostname))
    url.hostname = `${slug}.localhost`;
  else if (!tenant && process.env.AUTH_TENANT_DOMAIN)
    url.hostname = `${slug}.${process.env.AUTH_TENANT_DOMAIN}`;
  url.pathname = path;
  url.search = "";
  url.hash = "";
  return url.href;
}
export function allowedTransferSource(source: string, target: string) {
  try {
    const from = new URL(source);
    const to = new URL(target);
    if (source !== from.origin || !resolveTenant(to.host)) return false;
    if (["localhost", "127.0.0.1"].includes(from.hostname))
      return (
        to.hostname.endsWith(".localhost") &&
        from.protocol === to.protocol &&
        from.port === to.port
      );
    return (
      source === process.env.AUTH_APP_ORIGIN &&
      from.protocol === "https:" &&
      to.protocol === "https:" &&
      Boolean(process.env.AUTH_TENANT_DOMAIN) &&
      to.hostname.endsWith(`.${process.env.AUTH_TENANT_DOMAIN}`)
    );
  } catch {
    return false;
  }
}
