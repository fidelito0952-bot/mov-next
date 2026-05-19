/**
 * Country Cloaker — Regla #4 del Detector.
 *
 * Equivalente a App\Services\Antibots\Rules\CloackerService (PHP).
 *
 * Llama a ip-api.com (vía geoip.ts compartido) para obtener el país de la IP.
 * Si NO está en `countries_allowed` → bloquea.
 *
 * - Fail-open: si la API falla/timeout, permite acceso.
 * - Cache global compartido con BlockIsp (1 fetch por IP).
 * - Si `countries_allowed` está vacía → bloquea TODO (igual que Laravel).
 */

import type { DetectionContext } from "../detector";
import { logDetection } from "../log";
import { geolocate } from "../geoip";

function isAllowedCountry(
  allowed: string[],
  visitorCountryCode: string | null | undefined
): boolean {
  if (!visitorCountryCode) return false;
  if (!Array.isArray(allowed) || allowed.length === 0) return false;
  const visitor = visitorCountryCode.trim().toUpperCase();
  for (const code of allowed) {
    if (typeof code !== "string") continue;
    if (code.trim().toUpperCase() === visitor) return true;
  }
  return false;
}

export async function runCloacker(ctx: DetectionContext): Promise<boolean> {
  const { config, ip, ua, url } = ctx;
  if (!config.country_check) return false;

  const geo = await geolocate(ip);
  if (!geo) return false; // fail-open

  if (!isAllowedCountry(config.countries_allowed, geo.countryCode)) {
    await logDetection({
      type: "country",
      ip,
      ua,
      url,
      reason: `país ${geo.countryCode || "?"} no permitido (${(
        config.countries_allowed || []
      ).join(",")})`,
      extra: {
        country: geo.country,
        countryCode: geo.countryCode,
      },
    });
    return true;
  }

  return false;
}
