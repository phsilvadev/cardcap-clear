import { NextRequest, NextResponse } from "next/server";
import { allowedTransferSource } from "@/lib/auth/tenant-url";
import { resolveTenant } from "@/lib/tenant";
const COOKIE = "cardap_login_transfer";
const options = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/api/auth/transfer",
  maxAge: 60,
};
const noStore = {
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};
export async function POST(request: NextRequest) {
  const target = `${request.nextUrl.protocol}//${request.headers.get("host")}`;
  if (!allowedTransferSource(request.headers.get("origin") || "", target))
    return new NextResponse(null, { status: 403, headers: noStore });
  if (Number(request.headers.get("content-length")) > 4096)
    return new NextResponse(null, { status: 413, headers: noStore });
  try {
    const form = await request.formData();
    const code = form.get("code");
    const path = form.get("path");
    if (
      typeof code !== "string" ||
      !/^[a-f0-9]{64}$/.test(code) ||
      !["/dashboard", "/dashboard/pedidos"].includes(String(path))
    )
      return new NextResponse(null, { status: 400, headers: noStore });
    const project = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!project || !/^[a-z0-9-]+$/.test(project))
      throw new Error("Firebase não configurado.");
    const response = await fetch(
      `https://southamerica-east1-${project}.cloudfunctions.net/tenantLoginTransfer`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: target },
        body: JSON.stringify({ data: { action: "redeem", code } }),
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      },
    );
    const result = await response.json();
    const data = result.result ?? result.data;
    if (
      !response.ok ||
      !data ||
      data.slug !== resolveTenant(new URL(target).host)?.slug ||
      typeof data.customToken !== "string" ||
      data.customToken.length > 4096
    )
      throw new Error("Transferência inválida.");
    const destination = new URL("/restaurantes/continuar", target);
    const redirect = NextResponse.redirect(destination, 303);
    for (const [key, value] of Object.entries(noStore))
      redirect.headers.set(key, value);
    redirect.cookies.set(
      "cardap_login_origin",
      request.headers.get("origin")!,
      { ...options, path: "/", maxAge: 3300 },
    );
    redirect.cookies.set(
      COOKIE,
      JSON.stringify({ customToken: data.customToken, path }),
      options,
    );
    return redirect;
  } catch {
    const response = NextResponse.redirect(
      new URL("/restaurantes/login?acesso=expirado", target),
      303,
    );
    for (const [key, value] of Object.entries(noStore))
      response.headers.set(key, value);
    return response;
  }
}
export async function GET(request: NextRequest) {
  if (
    request.headers.get("x-cardap-transfer") !== "1" ||
    !resolveTenant(request.headers.get("host") || "")
  )
    return new NextResponse(null, { status: 403, headers: noStore });
  const response = () => {
    const result = NextResponse.json(
      { error: "Acesso expirado. Entre novamente." },
      { status: 401, headers: noStore },
    );
    result.cookies.set(COOKIE, "", { ...options, maxAge: 0 });
    return result;
  };
  try {
    const data = JSON.parse(request.cookies.get(COOKIE)?.value || "null");
    if (
      !data ||
      typeof data.customToken !== "string" ||
      data.customToken.length > 4096 ||
      !["/dashboard", "/dashboard/pedidos"].includes(data.path)
    )
      return response();
    const result = NextResponse.json(data, { headers: noStore });
    result.cookies.set(COOKIE, "", { ...options, maxAge: 0 });
    return result;
  } catch {
    return response();
  }
}
