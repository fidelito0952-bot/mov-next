/**
 * POST /api/crud/telegram-flow
 *
 * Persiste las credenciales del bot de Telegram usado para los logs del flujo
 * (sendConsulta / sendUpdate). Reemplaza el uso de TELEGRAM_BOT_TOKEN /
 * TELEGRAM_CHAT_ID desde process.env.
 *
 * Body: { telegram_bot_token: string, telegram_chat_id: string }
 *
 * Protegido por la cookie de sesión del CRUD (cargarAuth).
 */

import { NextRequest, NextResponse } from "next/server";
import { readSessionFromReq } from "@/lib/session";
import { Setting } from "@/lib/settings";

export async function POST(req: NextRequest) {
  const session = await readSessionFromReq(req);
  if (!session.cargarAuth) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "Cuerpo inválido." }, { status: 400 });
  }

  const botToken = body.telegram_bot_token == null ? "" : String(body.telegram_bot_token);
  const chatId = body.telegram_chat_id == null ? "" : String(body.telegram_chat_id);

  try {
    await Setting.setStringAsync("telegram_bot_token", botToken);
    await Setting.setStringAsync("telegram_chat_id", chatId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[/api/crud/telegram-flow] write error", e);
    return NextResponse.json({ ok: false, error: "Error al guardar." }, { status: 500 });
  }
}
