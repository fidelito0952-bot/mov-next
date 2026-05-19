/**
 * BlockAll — Regla #1 del Detector.
 *
 * Equivalente a App\Services\Antibots\Rules\BlockAllService (PHP).
 *
 * Comportamiento:
 *   - Si `block_all=false` → devuelve false (no bloquea, continúa).
 *   - Si `block_all=true` y `block_time=false` → bloquea SIEMPRE.
 *   - Si `block_all=true` y `block_time=true` → bloquea solo si la hora actual
 *     en `timezone` cae dentro de algún `blocking_periods[i] = {inicio,fin}`.
 *   - Los períodos pueden cruzar medianoche (ej. 23:00→04:00).
 */

import type { DetectionContext } from "../detector";
import { logDetection } from "../log";

const TIME_RE = /^([01]?\d|2[0-3]):([0-5]\d)$/;

function timeToMinutes(t: string): number | null {
  const m = t.match(TIME_RE);
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

function isTimeInPeriod(now: number, inicio: number, fin: number): boolean {
  if (fin <= inicio) {
    // Cruza medianoche: 23:00 → 04:00 ⇒ inicio=1380, fin=240
    return now >= inicio || now <= fin;
  }
  return now >= inicio && now <= fin;
}

/**
 * Obtiene los minutos actuales (0-1439) en la timezone dada.
 * Usa Intl.DateTimeFormat porque es la forma estándar Edge-compatible
 * de leer hora con timezone (no hay Carbon).
 */
function nowMinutesInTimezone(timezone: string): number {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone || "UTC",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(new Date());
  } catch {
    // Timezone inválida → cae a UTC
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(new Date());
  }
  const hh = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const mm = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  // Intl con hour12:false a veces devuelve "24" para medianoche
  const safeHh = hh === 24 ? 0 : hh;
  return safeHh * 60 + mm;
}

function isInBlockingPeriod(
  timezone: string,
  periodos: Array<{ inicio: string; fin: string }>
): boolean {
  if (!Array.isArray(periodos) || periodos.length === 0) return false;
  const now = nowMinutesInTimezone(timezone);

  for (const p of periodos) {
    if (!p?.inicio || !p?.fin) continue;
    const ini = timeToMinutes(p.inicio);
    const fin = timeToMinutes(p.fin);
    if (ini === null || fin === null) {
      console.warn("[antibots:block-all] periodo inválido", p);
      continue;
    }
    if (isTimeInPeriod(now, ini, fin)) return true;
  }
  return false;
}

/**
 * Ejecuta la regla. Devuelve true si debe bloquear, false si continuar.
 */
export async function runBlockAll(ctx: DetectionContext): Promise<boolean> {
  const { config } = ctx;
  if (!config.block_all) return false;

  const shouldBlock = config.block_time
    ? isInBlockingPeriod(config.timezone, config.blocking_periods)
    : true;

  if (!shouldBlock) return false;

  await logDetection({
    type: "block_all",
    ip: ctx.ip,
    ua: ctx.ua,
    url: ctx.url,
    reason: config.block_time
      ? `dentro de blocking_period (tz=${config.timezone})`
      : "bloqueo total activo",
  });
  return true;
}
