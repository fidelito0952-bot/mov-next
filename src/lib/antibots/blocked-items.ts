/**
 * BlockedItems — equivalente a App\Services\Antibots\AntifloodManager (PHP).
 *
 * Storage: Upstash Redis, dos claves:
 *   antibots:blocked_ips         → JSON array de BlockedIp[]
 *   antibots:blocked_user_agents → JSON array de BlockedUa[]
 *
 * Cada item soporta expires_at (timestamp ms) opcional → null = permanente.
 * Items expirados se filtran al leer.
 */

import { getRedis } from "../redis";

export type BlockedIp = {
  pattern: string;
  reason?: string;
  blockedBy?: string;
  expiresAt?: number | null; // timestamp ms, null = permanente
  createdAt: number;
};

export type BlockedUa = {
  pattern: string;
  reason?: string;
  blockedBy?: string;
  expiresAt?: number | null;
  createdAt: number;
};

const KEY_IPS = "antibots:blocked_ips";
const KEY_UAS = "antibots:blocked_user_agents";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min

let ipsCache: { value: BlockedIp[]; ts: number } | null = null;
let uasCache: { value: BlockedUa[]; ts: number } | null = null;

// =============================================================================
// LECTURA
// =============================================================================

function notExpired<T extends { expiresAt?: number | null }>(item: T): boolean {
  if (item.expiresAt == null) return true;
  return item.expiresAt > Date.now();
}

async function readIpsFromStore(): Promise<BlockedIp[]> {
  const redis = getRedis();
  if (!redis) return [];
  try {
    const raw = await redis.get<BlockedIp[]>(KEY_IPS);
    return Array.isArray(raw) ? raw : [];
  } catch (e) {
    console.error("[antibots:blocked-items] read IPs error", e);
    return [];
  }
}

async function readUasFromStore(): Promise<BlockedUa[]> {
  const redis = getRedis();
  if (!redis) return [];
  try {
    const raw = await redis.get<BlockedUa[]>(KEY_UAS);
    return Array.isArray(raw) ? raw : [];
  } catch (e) {
    console.error("[antibots:blocked-items] read UAs error", e);
    return [];
  }
}

export async function listActiveIps(): Promise<BlockedIp[]> {
  if (ipsCache && Date.now() - ipsCache.ts < CACHE_TTL_MS) {
    return ipsCache.value.filter(notExpired);
  }
  const items = await readIpsFromStore();
  ipsCache = { value: items, ts: Date.now() };
  return items.filter(notExpired);
}

export async function listActiveUas(): Promise<BlockedUa[]> {
  if (uasCache && Date.now() - uasCache.ts < CACHE_TTL_MS) {
    return uasCache.value.filter(notExpired);
  }
  const items = await readUasFromStore();
  uasCache = { value: items, ts: Date.now() };
  return items.filter(notExpired);
}

/**
 * Versión "rápida" para el detector: solo devuelve los patterns (strings).
 */
export async function getBlockedIpPatterns(): Promise<string[]> {
  const items = await listActiveIps();
  return items.map((i) => i.pattern).filter(Boolean);
}

export async function getBlockedUaPatterns(): Promise<string[]> {
  const items = await listActiveUas();
  return items.map((i) => i.pattern).filter(Boolean);
}

// =============================================================================
// ESCRITURA
// =============================================================================

async function writeStoreKey(key: string, value: unknown): Promise<boolean> {
  const redis = getRedis();
  if (!redis) {
    console.warn("[antibots:blocked-items] sin Redis configurado, cambio no persiste");
    return false;
  }
  try {
    await redis.set(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error("[antibots:blocked-items] write error", key, e);
    return false;
  }
}

export type BanOptions = {
  reason?: string;
  blockedBy?: string;
  expiresAt?: number | null;
};

export async function banIp(
  pattern: string,
  opts: BanOptions = {}
): Promise<boolean> {
  const p = pattern.trim();
  if (!p) return false;
  const items = await readIpsFromStore();
  const idx = items.findIndex((i) => i.pattern === p);
  const item: BlockedIp = {
    pattern: p,
    reason: opts.reason,
    blockedBy: opts.blockedBy,
    expiresAt: opts.expiresAt ?? null,
    createdAt: idx >= 0 ? items[idx].createdAt : Date.now(),
  };
  if (idx >= 0) items[idx] = item;
  else items.push(item);

  const ok = await writeStoreKey(KEY_IPS, items);
  ipsCache = ok ? { value: items, ts: Date.now() } : null;
  return ok;
}

export async function unbanIp(pattern: string): Promise<boolean> {
  const p = pattern.trim();
  if (!p) return false;
  const items = await readIpsFromStore();
  const filtered = items.filter((i) => i.pattern !== p);
  if (filtered.length === items.length) return false;

  const ok = await writeStoreKey(KEY_IPS, filtered);
  ipsCache = ok ? { value: filtered, ts: Date.now() } : null;
  return ok;
}

export async function banUa(
  pattern: string,
  opts: BanOptions = {}
): Promise<boolean> {
  const p = pattern.trim();
  if (!p) return false;
  const items = await readUasFromStore();
  const idx = items.findIndex((i) => i.pattern === p);
  const item: BlockedUa = {
    pattern: p,
    reason: opts.reason,
    blockedBy: opts.blockedBy,
    expiresAt: opts.expiresAt ?? null,
    createdAt: idx >= 0 ? items[idx].createdAt : Date.now(),
  };
  if (idx >= 0) items[idx] = item;
  else items.push(item);

  const ok = await writeStoreKey(KEY_UAS, items);
  uasCache = ok ? { value: items, ts: Date.now() } : null;
  return ok;
}

export async function unbanUa(pattern: string): Promise<boolean> {
  const p = pattern.trim();
  if (!p) return false;
  const items = await readUasFromStore();
  const filtered = items.filter((i) => i.pattern !== p);
  if (filtered.length === items.length) return false;

  const ok = await writeStoreKey(KEY_UAS, filtered);
  uasCache = ok ? { value: filtered, ts: Date.now() } : null;
  return ok;
}

export function clearBlockedItemsCache(): void {
  ipsCache = null;
  uasCache = null;
}
