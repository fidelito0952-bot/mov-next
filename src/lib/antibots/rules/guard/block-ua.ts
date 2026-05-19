/**
 * BlockUa — Sub-regla 2 de Guardian.
 *
 * Equivalente a App\Services\Antibots\Rules\Guard\BlockUa (PHP).
 *
 * Lógica (orden de chequeo igual a Laravel):
 *   1. UA vacío o whitespace → bloquea
 *   2. UA matchea exactamente alguno de EXACT_BLOCKED_UAS → bloquea
 *   3. UA contiene (case-insensitive) algún COMMON_BOT_PATTERN → bloquea
 *   4. UA contiene (case-insensitive) algún BLOCKED_WORD → bloquea
 *   5. UA contiene (case-insensitive) algún BOT_PATTERN → bloquea
 *
 * Sin IO. Las listas hardcoded viven en data/ua-patterns.ts.
 */

import type { DetectionContext } from "../../detector";
import { isValidIp } from "../../helpers";
import { logDetection } from "../../log";
import {
  BLOCKED_WORDS,
  BOT_PATTERNS,
  EXACT_BLOCKED_UAS,
  COMMON_BOT_PATTERNS,
} from "./data/ua-patterns";

function containsCi(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

function findMatch(ua: string, lower: string): string | null {
  // 2. Exacto
  if (EXACT_BLOCKED_UAS.includes(ua)) return "exact-match";

  // 3. Common bot patterns
  for (const p of COMMON_BOT_PATTERNS) {
    if (containsCi(ua, p)) return `common:${p}`;
  }

  // 4. Blocked words
  for (const w of BLOCKED_WORDS) {
    if (lower.includes(w.toLowerCase())) return `word:${w}`;
  }

  // 5. Bot patterns
  for (const p of BOT_PATTERNS) {
    if (containsCi(ua, p)) return `bot:${p}`;
  }

  return null;
}

export async function runBlockUa(ctx: DetectionContext): Promise<boolean> {
  const { ip, ua, url } = ctx;
  if (!ip || !isValidIp(ip)) return false;

  const lower = (ua || "").toLowerCase();

  // 1. UA vacío o whitespace
  if (lower.trim() === "") {
    await logDetection({
      type: "block_ua",
      ip,
      ua,
      url,
      reason: "Empty User-Agent",
    });
    return true;
  }

  const matched = findMatch(ua, lower);
  if (!matched) return false;

  await logDetection({
    type: "block_ua",
    ip,
    ua,
    url,
    reason: `UA bloqueado por patrón ${matched}`,
    extra: { matched },
  });
  return true;
}
