import { getRedis, hasRedis } from "./redis";

/**
 * Storage backend: Upstash Redis (HASH "settings").
 *
 * Env vars:
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 *
 * Cada setting es un campo dentro del hash `settings`. Esto permite leer
 * todos los settings en una sola llamada (HGETALL) en preloadSettings().
 */

const HASH_KEY = "settings";

const cache = new Map<string, { value: string; ts: number }>();
const CACHE_TTL_MS = 10_000;

async function readRaw(key: string): Promise<string | null> {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.value;
  }
  const redis = getRedis();
  if (!redis) return null;
  try {
    const raw = await redis.hget<string>(HASH_KEY, key);
    if (raw == null) return null;
    const str = String(raw);
    cache.set(key, { value: str, ts: Date.now() });
    return str;
  } catch (e) {
    console.error("[settings] redis read error", key, e);
    return null;
  }
}

async function writeRaw(key: string, value: string): Promise<void> {
  cache.set(key, { value, ts: Date.now() });

  const redis = getRedis();
  if (!redis) {
    console.warn("[settings] sin UPSTASH_REDIS_REST_URL/TOKEN: el cambio no persiste");
    return;
  }

  try {
    await redis.hset(HASH_KEY, { [key]: value });
  } catch (e) {
    console.error("[settings] redis write error", key, e);
  }
}

export const Setting = {
  async getBoolAsync(key: string, def = false): Promise<boolean> {
    const raw = await readRaw(key);
    if (raw == null) return def;
    return raw === "1" || raw.toLowerCase() === "true";
  },
  async setBoolAsync(key: string, value: boolean): Promise<void> {
    await writeRaw(key, value ? "1" : "0");
  },
  async getStringAsync(key: string, def = ""): Promise<string> {
    const raw = await readRaw(key);
    return raw ?? def;
  },
  async setStringAsync(key: string, value: string): Promise<void> {
    await writeRaw(key, value);
  },

  // ===== APIs sync (devuelven cache, sino default) =====
  getBool(key: string, def = false): boolean {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      return cached.value === "1" || cached.value.toLowerCase() === "true";
    }
    return def;
  },
  getString(key: string, def = ""): string {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      return cached.value;
    }
    return def;
  },
};

/**
 * Pre-carga todas las settings en cache con una sola llamada HGETALL.
 * Llamar al inicio de Server Components / API routes que las usen.
 */
export async function preloadSettings(): Promise<void> {
  if (!hasRedis()) return;
  const redis = getRedis();
  if (!redis) return;
  try {
    const all = (await redis.hgetall<Record<string, unknown>>(HASH_KEY)) ?? {};
    const now = Date.now();
    for (const [key, value] of Object.entries(all)) {
      cache.set(key, { value: String(value), ts: now });
    }
  } catch (e) {
    console.error("[settings] preload error", e);
  }
}
