import {
  APP_CHECK_COOKIE,
  appCheckRequired,
  verifyWebAppCheck,
} from "@/lib/security/app-check";
import {
  allowedTransferSource,
  tenantDashboardUrl,
} from "@/lib/auth/tenant-url";
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
  const appCheckToken = request.headers.get("x-firebase-appcheck");
  const appCheck = appCheckToken
    ? await verifyWebAppCheck(appCheckToken)
    : null;
  if (appCheckRequired() && !appCheck)
    return NextResponse.json(
      {
        error:
          "Não foi possível validar a proteção contra robôs. Atualize a página e tente novamente.",
      },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  const session = await verifyTenantSession(
    token,
    appCheck ? appCheckToken! : undefined,
  );
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
    {
      destination:
        process.env.AUTH_TENANT_SUBDOMAIN_LOGIN === "true"
          ? tenantDashboardUrl(
              `${request.nextUrl.protocol}//${host}`,
              session.slug,
            )
          : "/dashboard",
      storeId: session.uid,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
  if (appCheck && appCheckToken)
    response.cookies.set(APP_CHECK_COOKIE, appCheckToken, {
      ...cookieOptions,
      maxAge: Math.max(
        0,
        Math.min(3300, Math.floor(appCheck.expireTime - Date.now() / 1000)),
      ),
    });
  else
    response.cookies.set(APP_CHECK_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  response.cookies.set(SESSION_COOKIE, token, {
    ...cookieOptions,
    maxAge: 3300,
  });
  return response;
}

export async function DELETE(request: NextRequest) {
  if (!sameOrigin(request)) return new NextResponse(null, { status: 403 });
  const source = request.cookies.get("cardap_login_origin")?.value;
  const target = `${request.nextUrl.protocol}//${request.headers.get("host")}`;
  const response =
    source && allowedTransferSource(source, target)
      ? NextResponse.json(
          { logoutOrigin: source },
          { headers: { "Cache-Control": "no-store" } },
        )
      : new NextResponse(null, { status: 204 });
  response.cookies.set(APP_CHECK_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  response.cookies.set("cardap_login_origin", "", {
    ...cookieOptions,
    maxAge: 0,
  });
  response.cookies.set(SESSION_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  return response;
}
