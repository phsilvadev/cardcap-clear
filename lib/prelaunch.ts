import { NextResponse, type NextRequest } from "next/server";

const publicAssets = new Set([
  "/branding/cardap-logo.png",
  "/images/launch-restaurant.png",
  "/images/launch-dashboard.png",
  "/images/launch-cardap-devices.png",
  "/images/launch-cardap-transparent.png",
]);

export function prelaunchResponse(request: NextRequest) {
  if (process.env.CARDAP_PRELAUNCH_ONLY === "false") return null;
  const { pathname } = request.nextUrl;
  const read = request.method === "GET" || request.method === "HEAD";
  if (read && (pathname === "/em-breve" || publicAssets.has(pathname))) {
    const response = NextResponse.next();
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
  if (!read || pathname === "/api" || pathname.startsWith("/api/")) {
    return NextResponse.json(
      {
        error:
          "A plataforma está em pré-lançamento. Acompanhe as novidades em /em-breve.",
      },
      {
        status: 503,
        headers: { "Cache-Control": "no-store", "Retry-After": "3600" },
      },
    );
  }
  const destination = new URL("/em-breve", request.url);
  const response = NextResponse.redirect(destination, 307);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
