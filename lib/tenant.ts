export interface Tenant {
  slug: string;
  name: string;
}

export function resolveTenant(host: string): Tenant | null {
  const hostname = host.toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
  const base = process.env.AUTH_TENANT_DOMAIN?.toLowerCase();
  const productionSlug =
    base && hostname.endsWith(`.${base}`)
      ? hostname.slice(0, -(base.length + 1))
      : null;
  const match =
    (productionSlug && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(productionSlug)
      ? [hostname, productionSlug]
      : null) ??
    /^([a-z0-9]+(?:-[a-z0-9]+)*)\.localhost$/.exec(hostname) ??
    /^cardap\.([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(hostname);
  if (!match || match[1].length > 63) return null;
  const slug = match[1];
  return {
    slug,
    name: slug
      .split("-")
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join(" "),
  };
}

export function isCentralHost(host: string): boolean {
  const hostname = host.toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
  if (["localhost", "127.0.0.1"].includes(hostname)) return true;
  const origin = process.env.AUTH_APP_ORIGIN;
  if (!origin) return false;
  try {
    return new URL(origin).hostname === hostname;
  } catch {
    return false;
  }
}
