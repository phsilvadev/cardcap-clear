import { NextRequest, NextResponse } from "next/server";
import { allowedTransferSource } from "@/lib/auth/tenant-url";
import { isCentralHost } from "@/lib/tenant";
const COOKIE = "cardap_logout_pending";
const options = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/api/auth/logout-transfer",
  maxAge: 60,
};
const headers = {
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
};
export async function POST(request: NextRequest) {
  const central = `${request.nextUrl.protocol}//${request.headers.get("host")}`;
  if (
    !isCentralHost(request.headers.get("host") || "") ||
    !allowedTransferSource(central, request.headers.get("origin") || "")
  )
    return new NextResponse(null, { status: 403, headers });
  const result = NextResponse.redirect(
    new URL("/restaurantes/sair", central),
    303,
  );
  result.headers.set("Cache-Control", "no-store");
  result.headers.set("Referrer-Policy", "no-referrer");
  result.cookies.set("cardap_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  result.cookies.set("cardap_app_check", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  result.cookies.set(COOKIE, "1", options);
  return result;
}
export async function GET(request: NextRequest) {
  if (
    request.headers.get("x-cardap-logout") !== "1" ||
    request.cookies.get(COOKIE)?.value !== "1" ||
    !isCentralHost(request.headers.get("host") || "")
  )
    return new NextResponse(null, { status: 403, headers });
  const result = NextResponse.json({ ok: true }, { headers });
  result.cookies.set(COOKIE, "", { ...options, maxAge: 0 });
  return result;
}
