/**
 * MobileDetect — Regla #6 del Detector.
 *
 * Equivalente a App\Services\Antibots\Rules\MobileDetect (PHP), que usa la lib
 * mobiledetect/mobiledetectlib (también regex-based internamente).
 *
 * En Edge runtime evitamos agregar dependencias pesadas. Hacemos detección con
 * regex propias sobre User-Agent — suficiente para distinguir mobile/tablet
 * vs desktop, que es lo que la regla necesita.
 *
 * Devuelve true (bloquear) si NO es mobile ni tablet.
 */

import type { DetectionContext } from "../detector";
import { logDetection } from "../log";

// Patrones (case-insensitive). Cobertura: la gran mayoría de UAs reales.
const TABLET_RE = /\b(iPad|Tablet|PlayBook|Kindle|Silk|Android(?!.*Mobile))\b/i;
const MOBILE_RE =
  /\b(iPhone|iPod|Mobile|Android.*Mobile|BlackBerry|BB10|IEMobile|Opera Mini|Opera Mobi|webOS|Windows Phone|Fennec|Symbian|Palm|MeeGo)\b/i;

export function isTablet(ua: string): boolean {
  if (!ua) return false;
  return TABLET_RE.test(ua);
}

export function isMobile(ua: string): boolean {
  if (!ua) return false;
  return MOBILE_RE.test(ua);
}

export async function runMobileDetect(ctx: DetectionContext): Promise<boolean> {
  const { config, ua, ip, url } = ctx;
  if (!config.mobile_detect) return false;

  if (isMobile(ua) || isTablet(ua)) return false;

  await logDetection({
    type: "mobile",
    ip,
    ua,
    url,
    reason: "no es mobile ni tablet",
  });
  return true;
}
