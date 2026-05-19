/**
 * Helpers compartidos por todas las reglas antibots.
 *
 * - getRealIp(req): obtiene la IP del cliente respetando cabeceras de proxy
 *                   (Cloudflare > X-Forwarded-For > X-Real-IP > Vercel).
 * - isValidIp(ip): valida IPv4/IPv6.
 * - ipMatchesWildcard(ip, '1.2.3.*'): wildcard estilo Laravel.
 * - ipInCidr(ip, '1.2.0.0/16'): IPv4 + IPv6.
 * - ipMatchesPattern(ip, pattern): exact | wildcard | CIDR.
 * - uaMatchesPattern(ua, pattern): regex '/.../flags' o substring case-insensitive.
 *
 * Diseñado para Edge runtime: sin Node APIs (net, dns, fs).
 */

import type { NextRequest } from "next/server";

const IPV4_RE = /^(\d{1,3}\.){3}\d{1,3}$/;

export function isValidIp(ip: string): boolean {
  if (!ip) return false;
  if (IPV4_RE.test(ip)) {
    return ip.split(".").every((o) => {
      const n = Number(o);
      return n >= 0 && n <= 255;
    });
  }
  // IPv6 simple: hex segments separados por :
  if (ip.includes(":")) {
    const parts = ip.split(":");
    return parts.length <= 8 && parts.every((p) => /^[0-9a-fA-F]{0,4}$/.test(p));
  }
  return false;
}

function extractFirstIp(value: string | null | undefined): string {
  if (!value) return "";
  return value.split(",")[0].trim();
}

export function getRealIp(req: NextRequest): string {
  const headers = req.headers;
  const cf = extractFirstIp(headers.get("cf-connecting-ip"));
  if (cf && isValidIp(cf)) return cf;

  const xff = extractFirstIp(headers.get("x-forwarded-for"));
  if (xff && isValidIp(xff)) return xff;

  const realIp = extractFirstIp(headers.get("x-real-ip"));
  if (realIp && isValidIp(realIp)) return realIp;

  // Vercel inyecta esta cabecera con la IP del cliente
  const vercel = extractFirstIp(headers.get("x-vercel-forwarded-for"));
  if (vercel && isValidIp(vercel)) return vercel;

  return "0.0.0.0";
}

// =============================================================================
// IP MATCHING
// =============================================================================

export function ipMatchesWildcard(ip: string, pattern: string): boolean {
  if (!pattern.includes("*")) return ip === pattern;
  // Construir regex: 192.168.* → /^192\.168\.\d+\.\d+$/
  const regex = new RegExp(
    "^" + pattern.replace(/\./g, "\\.").replace(/\*/g, "[0-9]+") + "$"
  );
  return regex.test(ip);
}

/**
 * Verifica si una IPv4 está dentro de un rango CIDR (1.2.3.0/24).
 */
function ipv4InCidr(ip: string, cidr: string): boolean {
  const [range, bitsStr] = cidr.split("/");
  const bits = parseInt(bitsStr, 10);
  if (bits < 0 || bits > 32) return false;

  const toInt = (s: string) =>
    s.split(".").reduce((acc, o) => (acc << 8) + Number(o), 0) >>> 0;

  const ipInt = toInt(ip);
  const rangeInt = toInt(range);
  // bits=0 → mask=0; bits=32 → mask=0xFFFFFFFF
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return (ipInt & mask) === (rangeInt & mask);
}

/**
 * Verifica si una IPv6 está dentro de un rango CIDR (2001:db8::/32).
 * Convierte ambas IPs a representación de 128 bits y compara bit a bit.
 */
function ipv6InCidr(ip: string, cidr: string): boolean {
  const [range, bitsStr] = cidr.split("/");
  const bits = parseInt(bitsStr, 10);
  if (bits < 0 || bits > 128) return false;

  const toBytes = (addr: string): number[] | null => {
    // Expandir :: a ceros
    if (addr.includes("::")) {
      const [head, tail] = addr.split("::");
      const headParts = head ? head.split(":") : [];
      const tailParts = tail ? tail.split(":") : [];
      const missing = 8 - headParts.length - tailParts.length;
      if (missing < 0) return null;
      const zeros = Array(missing).fill("0");
      addr = [...headParts, ...zeros, ...tailParts].join(":");
    }
    const parts = addr.split(":");
    if (parts.length !== 8) return null;
    const bytes: number[] = [];
    for (const p of parts) {
      const n = parseInt(p, 16);
      if (isNaN(n) || n < 0 || n > 0xffff) return null;
      bytes.push((n >> 8) & 0xff, n & 0xff);
    }
    return bytes;
  };

  const ipBytes = toBytes(ip);
  const rangeBytes = toBytes(range);
  if (!ipBytes || !rangeBytes) return false;

  let bitsRemaining = bits;
  for (let i = 0; i < 16; i++) {
    if (bitsRemaining <= 0) break;
    if (bitsRemaining >= 8) {
      if (ipBytes[i] !== rangeBytes[i]) return false;
      bitsRemaining -= 8;
    } else {
      const mask = (0xff << (8 - bitsRemaining)) & 0xff;
      if ((ipBytes[i] & mask) !== (rangeBytes[i] & mask)) return false;
      bitsRemaining = 0;
    }
  }
  return true;
}

export function ipInCidr(ip: string, cidr: string): boolean {
  if (!cidr.includes("/")) return false;
  if (ip.includes(":")) return ipv6InCidr(ip, cidr);
  return ipv4InCidr(ip, cidr);
}

/**
 * Combina los tres tipos de match. Es el equivalente de
 * ipMatchesPattern(ip, pattern) que usa Laravel en AntifloodService y WhitelistService.
 */
export function ipMatchesPattern(ip: string, pattern: string): boolean {
  const p = pattern.trim();
  if (!p) return false;
  if (p.includes("/")) return ipInCidr(ip, p);
  if (p.includes("*")) return ipMatchesWildcard(ip, p);
  return ip === p;
}

// =============================================================================
// USER-AGENT MATCHING
// =============================================================================

const REGEX_PATTERN_RE = /^\/(.+)\/([gimsuy]*)$/;

export function uaMatchesPattern(ua: string, pattern: string): boolean {
  const p = pattern.trim();
  if (!p) return false;
  const re = p.match(REGEX_PATTERN_RE);
  if (re) {
    try {
      return new RegExp(re[1], re[2]).test(ua);
    } catch {
      return false;
    }
  }
  return ua.toLowerCase().includes(p.toLowerCase());
}
