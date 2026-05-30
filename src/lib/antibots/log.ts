/**
 * Logging centralizado para antibots.
 * Imprime en consola (visible en Vercel Logs) y opcionalmente dispara
 * notificación a Telegram via sendAntibotBlock().
 */

import { sendAntibotBlock, type AntibotEvent } from "./telegram";
import { mergedAntibotConfig } from "./config";

export async function logDetection(
  event: AntibotEvent
): Promise<void> {
  const action = event.type === "whitelist" ? "ALLOW" : "BLOCK";
  console.info(
    `[antibots] ${action} type=${event.type} ip=${event.ip} url=${event.url}` +
      (event.reason ? ` reason="${event.reason}"` : "")
  );

  // Telegram (solo si tg=true en config)
  try {
    const cfg = await mergedAntibotConfig();
    if (cfg.tg) {
      await sendAntibotBlock(event);
    }
  } catch (e) {
    console.warn("[antibots] log telegram failed", e);
  }
}
