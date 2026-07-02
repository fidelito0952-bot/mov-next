import { NextRequest, NextResponse } from "next/server";
import { readSessionFromReq } from "@/lib/session";
import { bulkUpsertFacturas } from "@/lib/facturas-cache";

export async function POST(req: NextRequest) {
  const session = await readSessionFromReq(req);
  if (!session.cargarAuth) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("archivo");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, errors: { archivo: "Debes seleccionar un archivo." } },
      { status: 422 }
    );
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json(
      { ok: false, errors: { archivo: "El archivo supera el tamaño máximo (10 MB)." } },
      { status: 422 }
    );
  }

  const name = file.name.toLowerCase();
  if (!name.endsWith(".txt")) {
    return NextResponse.json(
      { ok: false, errors: { archivo: "El archivo debe ser un .txt" } },
      { status: 422 }
    );
  }

  const text = await file.text();
  const lineas = text.split(/\r\n|\r|\n/);

  const rows: Array<{ telefono: string; valor: number; nombre: string }> = [];
  let errores = 0;

  for (const lRaw of lineas) {
    const linea = lRaw.trim();
    if (!linea) continue;
    const cols = linea.split(",").map((c) => c.trim());
    if (cols.length < 2) {
      errores++;
      continue;
    }
    const telefono = cols[0].replace(/\D/g, "");
    const valor = parseInt(cols[1].replace(/\D/g, ""), 10) || 0;
    const nombre = cols[2] ?? "";
    if (!telefono || valor <= 0) {
      errores++;
      continue;
    }
    rows.push({ telefono, valor, nombre });
  }

  const result = await bulkUpsertFacturas(rows);

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Error al guardar en Redis. El archivo podría ser demasiado grande o hay un problema de conexión. Intenta de nuevo.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    resultado: {
      insertados: result.inserted,
      actualizados: result.updated,
      errores,
    },
  });
}
