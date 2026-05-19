/**
 * BlockIsp — Sub-regla 4 de Guardian.
 *
 * Equivalente a App\Services\Antibots\Rules\Guard\BlockIsp (PHP).
 *
 * El Laravel original usa extreme-ip-lookup.com, que hoy requiere API key
 * (devuelve status:"fail" y campos vacíos sin ella). Acá usamos ip-api.com
 * (mismo provider que Country Cloaker), que SÍ es free y comparte cache.
 *
 * Compara el campo `org` (fallback `isp`) con la lista BANNED_ISPS por
 * substring case-insensitive. Cualquier match parcial bloquea.
 */

import type { DetectionContext } from "../../detector";
import { isValidIp } from "../../helpers";
import { logDetection } from "../../log";
import { geolocate } from "../../geoip";
import { BANNED_ISPS } from "./data/isp-list";

function matchedBannedIsp(isp: string): string | null {
  const lower = isp.toLowerCase();
  for (const banned of BANNED_ISPS) {
    if (lower.includes(banned.toLowerCase())) return banned;
  }
  return null;
}

export async function runBlockIsp(ctx: DetectionContext): Promise<boolean> {
  const { ip, ua, url } = ctx;
  if (!ip || !isValidIp(ip)) return false;

  const geo = await geolocate(ip);
  if (!geo) return false; // fail-open

  // Igual que Laravel: solo verifica `org` (no `isp`).
  const isp = (geo.org || "").trim();
  if (!isp) return false;

  const matched = matchedBannedIsp(isp);
  if (!matched) return false;

  await logDetection({
    type: "block_isp",
    ip,
    ua,
    url,
    reason: `ISP "${isp}" match "${matched}"`,
    extra: { isp, matched },
  });
  return true;
}
