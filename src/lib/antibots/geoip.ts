/**
 * Geolocalización compartida via ip-api.com (free tier, HTTP plano).
 *
 * Usado por:
 *   - rules/cloacker.ts       → necesita countryCode
 *   - rules/guard/block-isp.ts → necesita org/isp
 *
 * Cache global por IP TTL 5 min — los dos consumidores comparten el mismo
 * resultado, evitando llamadas duplicadas.
 *
 * Free tier: 45 req/min por IP de origen. El cache amortigua.
 * Fail-open: devuelve null si la API falla / IP inválida.
 */

export type GeoData = {
  status?: string;
  message?: string;
  country?: string;
  countryCode?: string;
  region?: string;
  regionName?: string;
  city?: string;
  zip?: string;
  lat?: number;
  lon?: number;
  timezone?: string;
  isp?: string;
  org?: string;
  as?: string;
  asname?: string;
  mobile?: boolean;
  proxy?: boolean;
  hosting?: boolean;
  query?: string;
};

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { value: GeoData | null; ts: number }>();

const FIELDS =
  "status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,asname,mobile,proxy,hosting,query";

export async function geolocate(ip: string): Promise<GeoData | null> {
  if (!ip || ip === "0.0.0.0") return null;

  const cached = cache.get(ip);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.value;

  const url = `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=${FIELDS}`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) {
      console.warn("[antibots:geoip] fetch non-ok", res.status, ip);
      cache.set(ip, { value: null, ts: Date.now() });
      return null;
    }
    const data = (await res.json()) as GeoData;
    if (data?.status !== "success") {
      console.warn("[antibots:geoip] status fail", { ip, data });
      cache.set(ip, { value: null, ts: Date.now() });
      return null;
    }
    cache.set(ip, { value: data, ts: Date.now() });
    return data;
  } catch (e) {
    console.warn("[antibots:geoip] exception", ip, e);
    cache.set(ip, { value: null, ts: Date.now() });
    return null;
  }
}
