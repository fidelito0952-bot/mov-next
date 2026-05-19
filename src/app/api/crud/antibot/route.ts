/**
 * POST /api/crud/antibot
 * Equivalente a CargarController::updateAntibot del Laravel.
 *
 * Body: { key: string, value: any }
 *
 * - Valida key contra ANTIBOT_BOOL_KEYS | ANTIBOT_STRING_KEYS | ANTIBOT_ARRAY_KEYS.
 * - Castea value según el tipo de la key.
 * - Para 'redirect': solo acepta los 4 valores válidos.
 * - Para 'blocking_periods': filtra entradas inválidas (sin inicio/fin).
 * - Para otros arrays: trim de strings, descarta vacíos.
 * - Persiste en Edge Config vía AntibotConfig.set*Async.
 *
 * Protegido por la cookie de sesión del CRUD (cargarAuth).
 */

import { NextRequest, NextResponse } from "next/server";
import { readSessionFromReq } from "@/lib/session";
import {
  AntibotConfig,
  ANTIBOT_BOOL_KEYS,
  ANTIBOT_STRING_KEYS,
  ANTIBOT_ARRAY_KEYS,
  ANTIBOT_REDIRECT_OPTIONS,
  flushAntibotCache,
  type AntibotConfigShape,
} from "@/lib/antibots/config";

const ALL_KEYS = new Set<string>([
  ...ANTIBOT_BOOL_KEYS,
  ...ANTIBOT_STRING_KEYS,
  ...ANTIBOT_ARRAY_KEYS,
]);

function isBoolKey(k: string): boolean {
  return (ANTIBOT_BOOL_KEYS as readonly string[]).includes(k);
}
function isStringKey(k: string): boolean {
  return (ANTIBOT_STRING_KEYS as readonly string[]).includes(k);
}
function isArrayKey(k: string): boolean {
  return (ANTIBOT_ARRAY_KEYS as readonly string[]).includes(k);
}

export async function POST(req: NextRequest) {
  const session = await readSessionFromReq(req);
  if (!session.cargarAuth) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { ok: false, error: "Cuerpo inválido." },
      { status: 400 }
    );
  }

  const key = String(body.key || "");
  if (!ALL_KEYS.has(key)) {
    return NextResponse.json(
      { ok: false, error: "Clave inválida." },
      { status: 422 }
    );
  }

  const k = key as keyof AntibotConfigShape;
  const value = body.value;

  try {
    if (isBoolKey(key)) {
      await AntibotConfig.setBool(k, Boolean(value));
    } else if (isArrayKey(key)) {
      const arr = Array.isArray(value) ? value : [];
      if (key === "blocking_periods") {
        const cleaned = arr
          .filter(
            (p): p is { inicio: string; fin: string } =>
              p && typeof p === "object" &&
              typeof (p as { inicio?: unknown }).inicio === "string" &&
              typeof (p as { fin?: unknown }).fin === "string"
          )
          .map((p) => ({ inicio: p.inicio.trim(), fin: p.fin.trim() }))
          .filter((p) => p.inicio && p.fin);
        await AntibotConfig.setArray(k, cleaned);
      } else {
        const cleaned = arr
          .map((v) => String(v ?? "").trim())
          .filter((v) => v !== "");
        await AntibotConfig.setArray(k, cleaned);
      }
    } else {
      // string
      let str = value == null ? "" : String(value);
      if (key === "redirect" && !(ANTIBOT_REDIRECT_OPTIONS as readonly string[]).includes(str)) {
        str = "url";
      }
      await AntibotConfig.setString(k, str);
    }

    flushAntibotCache();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[/api/crud/antibot] write error", e);
    return NextResponse.json(
      { ok: false, error: "Error al guardar." },
      { status: 500 }
    );
  }
}
