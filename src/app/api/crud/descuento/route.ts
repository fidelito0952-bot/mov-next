import { NextRequest, NextResponse } from "next/server";
import { readSessionFromReq } from "@/lib/session";
import { Setting } from "@/lib/settings";

export async function POST(req: NextRequest) {
  const session = await readSessionFromReq(req);
  if (!session.cargarAuth) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body.porcentaje !== "number") {
    return NextResponse.json(
      { ok: false, error: "Porcentaje inválido." },
      { status: 422 }
    );
  }

  let pct = Math.round(body.porcentaje);
  if (pct < 0) pct = 0;
  if (pct > 100) pct = 100;

  await Setting.setStringAsync("descuento_porcentaje", String(pct));
  return NextResponse.json({ ok: true });
}
