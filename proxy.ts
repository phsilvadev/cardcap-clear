import { NextResponse, type NextRequest } from "next/server";
import { resolveTenant } from "@/lib/tenant";

export function proxy(request: NextRequest) {
  if (
    request.nextUrl.pathname === "/tenants" ||
    request.nextUrl.pathname.startsWith("/tenants/")
  ) {
    return new NextResponse("Página não encontrada.", { status: 404 });
  }

  const tenant = resolveTenant(request.headers.get("host") ?? "");
  if (!tenant)
    return new NextResponse("Domínio de tenant não encontrado.", {
      status: 404,
    });

  const destination = new URL(request.url);
  destination.pathname = `/tenants/${tenant.slug}${request.nextUrl.pathname}`;
  return NextResponse.rewrite(destination);
}

export const config = {
  matcher: ["/dashboard/:path*", "/tenants/:path*"],
};
