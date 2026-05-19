/**
 * Notificaciones de antibots a Telegram (bot separado del de pagos).
 *
 * Fuentes de credenciales (en orden de prioridad):
 *   1. Edge Config (claves antibot:bot_token, antibot:chat_id, antibot:topic_id)
 *      → seteables desde el panel CRUD sin redeploy.
 *   2. Env vars: ANTIBOTS_TELEGRAM_BOT_TOKEN/_CHAT_ID/_TOPIC_ID → fallback.
 *
 * Vacíos = no envía (fail-silent).
 */

import { mergedAntibotConfig } from "./config";

async function getCreds(): Promise<{
  token: string;
  chatId: string;
  topicId: string;
}> {
  let cfg: Awaited<ReturnType<typeof mergedAntibotConfig>> | null = null;
  try {
    cfg = await mergedAntibotConfig();
  } catch {
    cfg = null;
  }
  const token =
    cfg?.bot_token?.trim() || process.env.ANTIBOTS_TELEGRAM_BOT_TOKEN || "";
  const chatId =
    cfg?.chat_id?.trim() || process.env.ANTIBOTS_TELEGRAM_CHAT_ID || "";
  const topicId =
    cfg?.topic_id?.trim() || process.env.ANTIBOTS_TELEGRAM_TOPIC_ID || "";
  return { token, chatId, topicId };
}

async function sendRaw(text: string): Promise<boolean> {
  const { token, chatId, topicId } = await getCreds();
  if (!token || !chatId) return false;

  const payload: Record<string, unknown> = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  };
  if (topicId) payload.message_thread_id = topicId;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) {
      console.warn("[antibot:telegram] non-ok", res.status);
      return false;
    }
    return true;
  } catch (e) {
    console.warn("[antibot:telegram] exception", e);
    return false;
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export type AntibotEvent = {
  type:
    | "block_all"
    | "antiflood_ip"
    | "antiflood_ua"
    | "country"
    | "mobile"
    | "block_bots"
    | "block_ua"
    | "block_hn"
    | "block_isp"
    | "block_fp"
    | "block_proxy"
    | "whitelist";
  ip: string;
  ua: string;
  url: string;
  reason?: string;
  extra?: Record<string, string | number | boolean | undefined>;
};

export async function sendAntibotBlock(event: AntibotEvent): Promise<boolean> {
  const verb = event.type === "whitelist" ? "✅ WHITELIST" : "🚫 BLOCK";
  const lines = [
    `${verb} <b>${event.type}</b>`,
    `🌐 <b>IP:</b> <code>${escapeHtml(event.ip)}</code>`,
    `🧭 <b>URL:</b> <code>${escapeHtml(event.url)}</code>`,
    `🖥 <b>UA:</b> <code>${escapeHtml(event.ua.slice(0, 200))}</code>`,
  ];
  if (event.reason) lines.push(`📝 ${escapeHtml(event.reason)}`);
  if (event.extra) {
    for (const [k, v] of Object.entries(event.extra)) {
      if (v == null) continue;
      lines.push(`▪️ <b>${k}:</b> <code>${escapeHtml(String(v))}</code>`);
    }
  }

  let msg = lines.join("\n");
  if (msg.length > 3500) msg = msg.slice(0, 3500) + "…";

  return sendRaw(msg);
}
