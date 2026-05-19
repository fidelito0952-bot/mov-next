import { NextRequest, NextResponse } from "next/server";
import { readSessionFromReq, writeSession } from "@/lib/session";

const PASSWORD = "Nohayesnada10!";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const password = String(body?.password || "");

  if (!password) {
    return NextResponse.json(
      { ok: false, error: "Contraseña requerida." },
      { status: 422 }
    );
  }

  if (password !== PASSWORD) {
    return NextResponse.json(
      { ok: false, error: "Contraseña incorrecta." },
      { status: 401 }
    );
  }

  const session = await readSessionFromReq(req);
  session.cargarAuth = true;

  const res = NextResponse.json({ ok: true });
  return await writeSession(res, session);
}
