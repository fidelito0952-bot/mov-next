import { NextRequest, NextResponse } from "next/server";
import { readSessionFromReq } from "@/lib/session";
import { clearFacturas } from "@/lib/facturas-cache";

export async function POST(req: NextRequest) {
  const session = await readSessionFromReq(req);
  if (!session.cargarAuth) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  const ok = await clearFacturas();
  return NextResponse.json({ ok, resultado: { cleared: true } });
}
