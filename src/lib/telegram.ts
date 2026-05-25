import { Setting } from "./settings";

const token = () => Setting.getString("telegram_bot_token", "");
const chatId = () => Setting.getString("telegram_chat_id", "");

async function send(message: string): Promise<boolean> {
  const t = token();
  const c = chatId();
  if (!t || !c) {
    console.warn("[telegram] TOKEN o CHAT_ID no configurados");
    return false;
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${t}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: c,
        text: message,
        parse_mode: "Markdown",
      }),
    });

    if (!res.ok) {
      console.error("[telegram] error", res.status, await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error("[telegram] exception", e);
    return false;
  }
}

/**
 * Equivalente a TelegramLogger::sendUpdate() de Movistar.
 * Imprime cualquier diccionario clave→valor con header de marca.
 */
export async function sendUpdate(
  data: Record<string, string | number | null | undefined>
): Promise<boolean> {
  let message = "📱 *MOVISTAR - Nueva Actualización*\n\n";
  for (const [k, v] of Object.entries(data)) {
    const val = v === null || v === undefined ? "" : String(v);
    message += `▪️ *${k}:* \`${val}\`\n`;
  }
  return send(message);
}
