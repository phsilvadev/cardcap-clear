import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifyTenantSession } from "@/lib/auth/session";
import { resolveTenant, isCentralHost } from "@/lib/tenant";

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const url = new URL(origin);
    return (
      url.origin === origin &&
      url.host === request.headers.get("host") &&
      url.protocol === request.nextUrl.protocol
    );
  } catch {
    return false;
  }
}
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
};

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return new NextResponse(null, { status: 403 });
  if (Number(request.headers.get("content-length")) > 8192)
    return new NextResponse(null, { status: 413 });
  let token: unknown;
  try {
    token = (await request.json()).idToken;
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  if (typeof token !== "string" || token.length > 4096)
    return new NextResponse(null, { status: 400 });
  const session = await verifyTenantSession(token);
  const host = request.headers.get("host") ?? "";
  const hostTenant = resolveTenant(host);
  if (
    !session ||
    (!hostTenant && !isCentralHost(host)) ||
    (hostTenant && hostTenant.slug !== session.slug)
  ) {
    const response = NextResponse.json(
      {
        error:
          "Conta sem acesso a este restaurante. Confira o cadastro e o endereço da loja.",
      },
      { status: 403 },
    );
    response.cookies.set(SESSION_COOKIE, "", { ...cookieOptions, maxAge: 0 });
    return response;
  }
  const response = NextResponse.json(
    { destination: "/dashboard" },
    { headers: { "Cache-Control": "no-store" } },
  );
  response.cookies.set(SESSION_COOKIE, token, {
    ...cookieOptions,
    maxAge: 3300,
  });
  return response;
}

export async function DELETE(request: NextRequest) {
  if (!sameOrigin(request)) return new NextResponse(null, { status: 403 });
  const response = new NextResponse(null, { status: 204 });
  response.cookies.set(SESSION_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  return response;
}
