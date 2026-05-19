import { NextRequest, NextResponse } from "next/server";
import { readSessionFromReq } from "@/lib/session";
import { Setting } from "@/lib/settings";

const KEY_RE = /^(nequi_enabled|bancolombia_enabled|pse_enabled|tarjeta_enabled|banco_[a-z0-9]+_enabled)$/;

export async function POST(req: NextRequest) {
  const session = await readSessionFromReq(req);
  if (!session.cargarAuth) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const key = String(body?.key || "");
  const enabled = Boolean(body?.enabled);

  if (!KEY_RE.test(key)) {
    return NextResponse.json({ ok: false, error: "Clave inválida." }, { status: 422 });
  }

  await Setting.setBoolAsync(key, enabled);
  return NextResponse.json({ ok: true });
}
