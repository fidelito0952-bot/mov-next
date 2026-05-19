/**
 * BlockProxy — Sub-regla 6 de Guardian.
 *
 * Equivalente a App\Services\Antibots\Rules\Guard\BlockProxy (PHP).
 *
 * Consulta a `https://blackbox.ipinfo.app/lookup/{ip}` que devuelve un body:
 *   "Y"  → es proxy/VPN  → bloquear
 *   "N"  → no es proxy   → permitir
 *
 * Detalles:
 *   - timeout 3s, fail-open si error o status != 200
 *   - cache global por IP TTL 10 min (Laravel usa request-scoped, en Edge
 *     compartimos entre requests para no quemar la API gratuita)
 */

import type { DetectionContext } from "../../detector";
import { isValidIp } from "../../helpers";
import { logDetection } from "../../log";

const API_URL = "https://blackbox.ipinfo.app/lookup/";
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 min
const cache = new Map<string, { value: boolean; ts: number }>();

async function checkProxy(ip: string): Promise<boolean> {
  const cached = cache.get(ip);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.value;

  try {
    const res = await fetch(API_URL + encodeURIComponent(ip), {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) {
      console.warn("[antibots:block-proxy] API fail", res.status, ip);
      cache.set(ip, { value: false, ts: Date.now() }); // fail-open
      return false;
    }
    const body = (await res.text()).trim();
    const isProxy = body === "Y";
    cache.set(ip, { value: isProxy, ts: Date.now() });
    return isProxy;
  } catch (e) {
    console.warn("[antibots:block-proxy] exception", ip, e);
    cache.set(ip, { value: false, ts: Date.now() }); // fail-open
    return false;
  }
}

export async function runBlockProxy(ctx: DetectionContext): Promise<boolean> {
  const { ip, ua, url } = ctx;
  if (!ip || !isValidIp(ip)) return false;

  const isProxy = await checkProxy(ip);
  if (!isProxy) return false;

  await logDetection({
    type: "block_proxy",
    ip,
    ua,
    url,
    reason: "IP detectada como proxy/VPN",
  });
  return true;
}
