export interface Tenant {
  slug: string;
  name: string;
}

export function resolveTenant(host: string): Tenant | null {
  const hostname = host.toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
  const match =
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
