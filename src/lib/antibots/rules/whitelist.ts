/**
 * Whitelist — Regla #2 del Detector.
 *
 * Equivalente a App\Services\Antibots\Rules\WhitelistService (PHP).
 *
 * Devuelve:
 *   - true  → está en whitelist (cortar cadena, NO ejecutar reglas siguientes).
 *   - false → no está en whitelist (continuar al siguiente filtro).
 *
 * Reusa los helpers de IP/UA matching:
 *   - ipMatchesPattern(ip, pattern): exact | wildcard | CIDR (IPv4/IPv6)
 *   - uaMatchesPattern(ua, pattern): regex /.../flags o substring case-insensitive
 */

import type { DetectionContext } from "../detector";
import { ipMatchesPattern, uaMatchesPattern, isValidIp } from "../helpers";
import { logDetection } from "../log";

function isIpWhitelisted(ip: string, list: string[]): boolean {
  if (!ip || !isValidIp(ip)) return false;
  for (const raw of list) {
    if (typeof raw !== "string") continue;
    const pattern = raw.trim();
    if (!pattern) continue;
    if (ipMatchesPattern(ip, pattern)) return true;
  }
  return false;
}

function isUaWhitelisted(ua: string, list: string[]): boolean {
  if (!ua) return false;
  for (const raw of list) {
    if (typeof raw !== "string") continue;
    const pattern = raw.trim();
    if (!pattern) continue;
    if (uaMatchesPattern(ua, pattern)) return true;
  }
  return false;
}

/**
 * Ejecuta la regla. Devuelve true si la request está en whitelist (y por lo
 * tanto debe saltarse el resto de las reglas).
 */
export async function runWhitelist(ctx: DetectionContext): Promise<boolean> {
  const { config, ip, ua, url } = ctx;
  if (!config.whitelist) return false;

  if (isIpWhitelisted(ip, config.whitelist_ips)) {
    await logDetection({
      type: "whitelist",
      ip,
      ua,
      url,
      reason: "IP whitelisted",
    });
    return true;
  }

  if (isUaWhitelisted(ua, config.whitelist_user_agents)) {
    await logDetection({
      type: "whitelist",
      ip,
      ua,
      url,
      reason: "User-Agent whitelisted",
    });
    return true;
  }

  return false;
}
