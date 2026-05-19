/**
 * Storage de configuración de antibots en Edge Config.
 *
 * Mismo patrón que src/lib/settings.ts:
 *   - Lectura vía @vercel/edge-config (rápido, cacheado en edge)
 *   - Escritura vía Vercel REST API (PATCH /v1/edge-config/{ID}/items)
 *
 * Las claves se guardan con prefijo "antibot:" para no chocar con settings:
 *   antibot:block_all         → "1" | "0"
 *   antibot:timezone          → "America/Bogota"
 *   antibot:blocking_periods  → JSON string
 *   etc.
 *
 * Defaults equivalentes a config/antibots.php → 'config'.
 */

import { get, getAll } from "@vercel/edge-config";

const PREFIX = "antibot:";

const hasEdgeConfig = () => Boolean(process.env.EDGE_CONFIG);
const hasWriteAccess = () =>
  Boolean(process.env.EDGE_CONFIG_ID && process.env.VERCEL_API_TOKEN);

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
const cache = new Map<string, { value: string; ts: number }>();
const CACHE_TTL_MS = 10_000;

let mergedCache: { value: AntibotConfigShape; ts: number } | null = null;
const MERGED_TTL_MS = 10_000;

async function readRaw(key: string): Promise<string | null> {
  const fullKey = PREFIX + key;
  const cached = cache.get(fullKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.value;
  if (!hasEdgeConfig()) return null;
  try {
    const raw = await get<string>(fullKey);
    if (raw == null) return null;
    const str = String(raw);
    cache.set(fullKey, { value: str, ts: Date.now() });
    return str;
  } catch (e) {
    console.error("[antibot:config] read error", key, e);
    return null;
  }
}

async function writeRaw(key: string, value: string): Promise<void> {
  const fullKey = PREFIX + key;
  cache.set(fullKey, { value, ts: Date.now() });
  mergedCache = null;

  if (!hasWriteAccess()) {
    console.warn("[antibot:config] sin token de escritura, cambio no persiste");
    return;
  }

  const id = process.env.EDGE_CONFIG_ID!;
  const token = process.env.VERCEL_API_TOKEN!;
  const teamId = process.env.VERCEL_TEAM_ID;
  const url = teamId
    ? `https://api.vercel.com/v1/edge-config/${id}/items?teamId=${teamId}`
    : `https://api.vercel.com/v1/edge-config/${id}/items`;

  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [{ operation: "upsert", key: fullKey, value }],
      }),
    });
    if (!res.ok) {
      console.error(
        "[antibot:config] write error",
        res.status,
        await res.text()
      );
    }
  } catch (e) {
    console.error("[antibot:config] write exception", key, e);
  }
}

function castBool(raw: string | null, def: boolean): boolean {
  if (raw == null) return def;
  return raw === "1" || raw.toLowerCase() === "true";
}

function castArray<T>(raw: string | null, def: T[]): T[] {
  if (raw == null || raw === "") return def;
  try {
    const decoded = JSON.parse(raw);
    return Array.isArray(decoded) ? decoded : def;
  } catch {
    return def;
  }
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
    return raw ?? def;
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
 * Devuelve el objeto completo: defaults + overrides desde Edge Config.
 * Equivalente a AntibotConfig::merged() en Laravel.
 * Una sola llamada `getAll()` → barata.
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

  if (!hasEdgeConfig()) {
    mergedCache = { value: result, ts: Date.now() };
    return result;
  }

  try {
    const all = (await getAll()) as Record<string, unknown> | undefined;
    if (!all) {
      mergedCache = { value: result, ts: Date.now() };
      return result;
    }

    for (const [fullKey, raw] of Object.entries(all)) {
      if (!fullKey.startsWith(PREFIX)) continue;
      const key = fullKey.slice(PREFIX.length) as keyof AntibotConfigShape;
      const def = ANTIBOT_DEFAULTS[key];

      if (typeof def === "boolean") {
        (result[key] as boolean) = castBool(String(raw), def);
      } else if (Array.isArray(def)) {
        // TS no puede inferir el tipo elemento de la unión sin un cast amplio
        (result as unknown as Record<string, unknown>)[key] = castArray(
          String(raw),
          def as unknown[]
        );
      } else {
        (result[key] as string) = String(raw);
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
