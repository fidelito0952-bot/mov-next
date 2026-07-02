import { NextRequest, NextResponse } from "next/server";
import { readSessionFromReq } from "@/lib/session";
import { bulkUpsertFacturas } from "@/lib/facturas-cache";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const session = await readSessionFromReq(req);
  if (!session.cargarAuth) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Body inválido. Debe ser JSON." },
      { status: 422 }
    );
  }

  const parsed = body as { rows?: Array<{ telefono: string; valor: number; nombre: string }> };
  if (!parsed.rows || !Array.isArray(parsed.rows)) {
    return NextResponse.json(
      { ok: false, error: "Se requiere un arreglo 'rows' con {telefono, valor, nombre}." },
      { status: 422 }
    );
  }

  if (parsed.rows.length > 10000) {
    return NextResponse.json(
      { ok: false, error: "Demasiadas filas en un solo lote (máx 10,000)." },
      { status: 422 }
    );
  }

  const result = await bulkUpsertFacturas(parsed.rows);

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: "Error al guardar en Redis. Intenta de nuevo." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    resultado: {
      insertados: result.inserted,
      actualizados: result.updated,
    },
  });
}
