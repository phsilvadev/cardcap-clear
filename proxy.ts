import { tenantDashboardUrl } from "@/lib/auth/tenant-url";
import { NextResponse, type NextRequest } from "next/server";
import { resolveTenant, isCentralHost } from "@/lib/tenant";
import {
  APP_CHECK_SESSION_COOKIE,
  SESSION_COOKIE,
  verifyTenantSession,
} from "@/lib/auth/session";

export async function proxy(request: NextRequest) {
  if (
    request.nextUrl.pathname === "/tenants" ||
    request.nextUrl.pathname.startsWith("/tenants/")
  ) {
    return new NextResponse("Página não encontrada.", { status: 404 });
  }

  const host = request.headers.get("host") ?? "";
  if (!resolveTenant(host) && !isCentralHost(host))
    return new NextResponse("Domínio não encontrado.", { status: 404 });
  const session = await verifyTenantSession(
    request.cookies.get(SESSION_COOKIE)?.value ?? "",
    request.cookies.get(APP_CHECK_SESSION_COOKIE)?.value,
  );
  if (!session) {
    const login = new URL("/restaurantes/login", request.url);
    const response = NextResponse.redirect(login);
    response.cookies.delete(SESSION_COOKIE);
    response.cookies.delete(APP_CHECK_SESSION_COOKIE);
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
  const tenant = resolveTenant(request.headers.get("host") ?? "");
  if (tenant && tenant.slug !== session.slug) {
    return new NextResponse("Você não tem acesso a este restaurante.", {
      status: 403,
    });
  }
  const path = request.nextUrl.pathname;
  if (
    ((path === "/dashboard/garcons" ||
      path.startsWith("/dashboard/garcons/")) &&
      !session.operations.salon) ||
    ((path === "/dashboard/entregadores" ||
      path.startsWith("/dashboard/entregadores/")) &&
      !session.operations.ownDelivery)
  ) {
    const response = NextResponse.redirect(
      new URL("/dashboard?view=settings&section=operations", request.url),
    );
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
  if (!tenant && process.env.AUTH_TENANT_SUBDOMAIN_LOGIN === "true") {
    const canonical = new URL(
      tenantDashboardUrl(request.nextUrl.origin, session.slug),
    );
    if (canonical.origin !== request.nextUrl.origin) {
      const response = NextResponse.redirect(
        new URL("/restaurantes/login", request.url),
      );
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }
  }
  const destination = new URL(request.url);
  destination.pathname = `/tenants/${session.slug}${request.nextUrl.pathname}`;
  const response = NextResponse.rewrite(destination);
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/tenants/:path*"],
};
