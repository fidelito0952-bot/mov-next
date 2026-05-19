/**
 * Antiflood — Regla #3 del Detector.
 *
 * Equivalente a App\Services\Antibots\Rules\AntifloodService (PHP).
 *
 * Combina dos fuentes de IPs/UAs bloqueados:
 *   1. Estática desde config (ip_list, user_agents_list)
 *   2. Dinámica desde Edge Config (antibots:blocked_ips / blocked_user_agents)
 *      manejada por banIp/unbanIp/banUa/unbanUa de blocked-items.ts.
 *
 * Devuelve true si la request debe bloquearse, false para continuar.
 */

import type { DetectionContext } from "../detector";
import { ipMatchesPattern, uaMatchesPattern, isValidIp } from "../helpers";
import {
  getBlockedIpPatterns,
  getBlockedUaPatterns,
} from "../blocked-items";
import { logDetection } from "../log";

function uniq(arr: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of arr) {
    if (typeof v !== "string") continue;
    const t = v.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

function isIpBlocked(ip: string, patterns: string[]): string | null {
  if (!ip || !isValidIp(ip)) return null;
  for (const p of patterns) {
    if (ipMatchesPattern(ip, p)) return p;
  }
  return null;
}

function isUaBlocked(ua: string, patterns: string[]): string | null {
  if (!ua) return null;
  for (const p of patterns) {
    if (uaMatchesPattern(ua, p)) return p;
  }
  return null;
}

export async function runAntiflood(ctx: DetectionContext): Promise<boolean> {
  const { config, ip, ua, url } = ctx;
  if (!config.antiflood) return false;

  // Merge config + DB (Edge Config dinámico)
  const [dbIps, dbUas] = await Promise.all([
    getBlockedIpPatterns(),
    getBlockedUaPatterns(),
  ]);
  const allIps = uniq([...(config.ip_list ?? []), ...dbIps]);
  const allUas = uniq([...(config.user_agents_list ?? []), ...dbUas]);

  const matchedIp = isIpBlocked(ip, allIps);
  if (matchedIp) {
    await logDetection({
      type: "antiflood_ip",
      ip,
      ua,
      url,
      reason: `IP match pattern: ${matchedIp}`,
    });
    return true;
  }

  const matchedUa = isUaBlocked(ua, allUas);
  if (matchedUa) {
    await logDetection({
      type: "antiflood_ua",
      ip,
      ua,
      url,
      reason: `UA match pattern: ${matchedUa}`,
    });
    return true;
  }

  return false;
}
