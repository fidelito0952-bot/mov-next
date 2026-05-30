/**
 * Storage de configuración de antibots en Upstash Redis.
 *
 * Mismo patrón que src/lib/settings.ts:
 *   - Lectura/escritura vía Upstash Redis REST
 *   - Una sola clave HASH "antibot:config" con los campos como propiedades
 *
 * Defaults equivalentes a config/antibots.php → 'config'.
 */

import { getRedis, hasRedis } from "../redis";

const HASH_KEY = "antibot:config";

// ---- Defaults (replican config/antibots.php) ----
export const ANTIBOT_DEFAULTS = {
  block_all: false,
  block_time: false,
  timezone: "America/Bogota",
  blocking_periods: [
    { inicio: "08:00", fin: "12:00" },
    { inicio: "14:00", fin: "18:00" },
  ] as Array<{ inicio: string; fin: string }>,

  whitelist: true,
  whitelist_ips: [] as string[],
  whitelist_user_agents: [] as string[],

  antiflood: false,
  ip_list: [] as string[],
  user_agents_list: [] as string[],

  country_check: false,
  countries_allowed: ["CO", "MX"] as string[],

  guard: false,
  anti_bots: false,
  anti_ua: false,
  anti_hn: false,
  anti_isp: false,
  anti_fingerprints: false,
  anti_proxy: false,

  mobile_detect: false,

  redirect: "url" as "url" | "abort_404" | "abort_500" | "landing",
  url: "https://www.google.com",

  tg: false,
  chat_id: "",
  bot_token: "",
  topic_id: "",
} as const;

export type AntibotConfigShape = {
  block_all: boolean;
  block_time: boolean;
  timezone: string;
  blocking_periods: Array<{ inicio: string; fin: string }>;
  whitelist: boolean;
  whitelist_ips: string[];
  whitelist_user_agents: string[];
  antiflood: boolean;
  ip_list: string[];
  user_agents_list: string[];
  country_check: boolean;
  countries_allowed: string[];
  guard: boolean;
  anti_bots: boolean;
  anti_ua: boolean;
  anti_hn: boolean;
  anti_isp: boolean;
  anti_fingerprints: boolean;
  anti_proxy: boolean;
  mobile_detect: boolean;
  redirect: "url" | "abort_404" | "abort_500" | "landing";
  url: string;
  tg: boolean;
  chat_id: string;
  bot_token: string;
  topic_id: string;
};

// ---- Cache local por lambda ----
// El cliente Upstash tiene automaticDeserialization=true por defecto: al leer
// strings JSON-válidos (arrays, "1", "true", etc.) los devuelve ya parseados.
// Por eso `cache` y los cast* aceptan `unknown` en vez de `string`.
const cache = new Map<string, { value: unknown; ts: number }>();
const CACHE_TTL_MS = 10_000;

let mergedCache: { value: AntibotConfigShape; ts: number } | null = null;
const MERGED_TTL_MS = 10_000;

async function readRaw(key: string): Promise<unknown> {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.value;
  const redis = getRedis();
  if (!redis) return null;
  try {
    const raw = await redis.hget(HASH_KEY, key);
    if (raw == null) return null;
    cache.set(key, { value: raw, ts: Date.now() });
    return raw;
  } catch (e) {
    console.error("[antibot:config] read error", key, e);
    return null;
  }
}

async function writeRaw(key: string, value: string): Promise<void> {
  cache.set(key, { value, ts: Date.now() });
  mergedCache = null;

  const redis = getRedis();
  if (!redis) {
    console.warn("[antibot:config] sin Redis configurado, cambio no persiste");
    return;
  }

  try {
    await redis.hset(HASH_KEY, { [key]: value });
  } catch (e) {
    console.error("[antibot:config] write error", key, e);
  }
}

function castBool(raw: unknown, def: boolean): boolean {
  if (raw == null) return def;
  if (typeof raw === "boolean") return raw;
  if (typeof raw === "number") return raw !== 0;
  if (typeof raw === "string") {
    return raw === "1" || raw.toLowerCase() === "true";
  }
  return def;
}

function castString(raw: unknown, def: string): string {
  if (raw == null) return def;
  if (typeof raw === "string") return raw;
  return String(raw);
}

function castArray<T>(raw: unknown, def: T[]): T[] {
  if (raw == null) return def;
  // Upstash puede devolver el array ya parseado (auto-deserialization).
  if (Array.isArray(raw)) return raw as T[];
  if (typeof raw === "string") {
    if (raw === "") return def;
    try {
      const decoded = JSON.parse(raw);
      return Array.isArray(decoded) ? decoded : def;
    } catch {
      return def;
    }
  }
  return def;
}

// =============================================================================
// API pública (espejo de AntibotConfig::get*/set* de Laravel)
// =============================================================================

export const AntibotConfig = {
  async getBool(key: keyof AntibotConfigShape, def = false): Promise<boolean> {
    const raw = await readRaw(key);
    return castBool(raw, def);
  },
  async setBool(key: keyof AntibotConfigShape, value: boolean): Promise<void> {
    await writeRaw(key, value ? "1" : "0");
  },
  async getString(key: keyof AntibotConfigShape, def = ""): Promise<string> {
    const raw = await readRaw(key);
    return castString(raw, def);
  },
  async setString(key: keyof AntibotConfigShape, value: string): Promise<void> {
    await writeRaw(key, value);
  },
  async getArray<T = unknown>(
    key: keyof AntibotConfigShape,
    def: T[] = []
  ): Promise<T[]> {
    const raw = await readRaw(key);
    return castArray<T>(raw, def);
  },
  async setArray<T = unknown>(
    key: keyof AntibotConfigShape,
    value: T[]
  ): Promise<void> {
    await writeRaw(key, JSON.stringify(value));
  },
};

/**
 * Devuelve el objeto completo: defaults + overrides desde Redis.
 * Equivalente a AntibotConfig::merged() en Laravel.
 * Una sola llamada `HGETALL antibot:config` → barata.
 */
export async function mergedAntibotConfig(): Promise<AntibotConfigShape> {
  if (mergedCache && Date.now() - mergedCache.ts < MERGED_TTL_MS) {
    return mergedCache.value;
  }

  const result: AntibotConfigShape = {
    ...ANTIBOT_DEFAULTS,
    blocking_periods: [...ANTIBOT_DEFAULTS.blocking_periods],
    whitelist_ips: [...ANTIBOT_DEFAULTS.whitelist_ips],
    whitelist_user_agents: [...ANTIBOT_DEFAULTS.whitelist_user_agents],
    ip_list: [...ANTIBOT_DEFAULTS.ip_list],
    user_agents_list: [...ANTIBOT_DEFAULTS.user_agents_list],
    countries_allowed: [...ANTIBOT_DEFAULTS.countries_allowed],
  };

  if (!hasRedis()) {
    mergedCache = { value: result, ts: Date.now() };
    return result;
  }

  const redis = getRedis();
  if (!redis) {
    mergedCache = { value: result, ts: Date.now() };
    return result;
  }

  try {
    const all = (await redis.hgetall<Record<string, unknown>>(HASH_KEY)) ?? {};

    for (const [key, raw] of Object.entries(all)) {
      const k = key as keyof AntibotConfigShape;
      const def = ANTIBOT_DEFAULTS[k];
      if (def === undefined) continue;

      if (typeof def === "boolean") {
        (result[k] as boolean) = castBool(raw, def);
      } else if (Array.isArray(def)) {
        (result as unknown as Record<string, unknown>)[k] = castArray(
          raw,
          def as unknown[]
        );
      } else {
        (result[k] as string) = castString(raw, def as string);
      }
    }
  } catch (e) {
    console.error("[antibot:config] merged error", e);
  }

  mergedCache = { value: result, ts: Date.now() };
  return result;
}

/**
 * Invalida el cache (útil tras una escritura desde el panel CRUD).
 */
export function flushAntibotCache(): void {
  cache.clear();
  mergedCache = null;
}

// =============================================================================
// Listas de claves (usadas por el endpoint /api/crud/antibot para validar)
// =============================================================================

export const ANTIBOT_BOOL_KEYS = [
  "block_all",
  "block_time",
  "whitelist",
  "antiflood",
  "country_check",
  "guard",
  "anti_bots",
  "anti_ua",
  "anti_hn",
  "anti_isp",
  "anti_fingerprints",
  "anti_proxy",
  "mobile_detect",
  "tg",
] as const;

export const ANTIBOT_STRING_KEYS = [
  "timezone",
  "redirect",
  "url",
  "chat_id",
  "bot_token",
  "topic_id",
] as const;

export const ANTIBOT_ARRAY_KEYS = [
  "whitelist_ips",
  "whitelist_user_agents",
  "ip_list",
  "user_agents_list",
  "countries_allowed",
  "blocking_periods",
] as const;

export const ANTIBOT_REDIRECT_OPTIONS = [
  "url",
  "abort_404",
  "abort_500",
  "landing",
] as const;
