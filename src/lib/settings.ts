import { get, getAll } from "@vercel/edge-config";

/**
 * Storage backend: Vercel Edge Config (lectura) + Vercel REST API (escritura).
 *
 * Env vars:
 *  - EDGE_CONFIG          → connection string para lectura (auto-inyectada por Vercel)
 *  - EDGE_CONFIG_ID       → ID del store (ecfg_xxx) para escritura via REST API
 *  - VERCEL_API_TOKEN     → personal access token para escritura
 *  - VERCEL_TEAM_ID       → opcional, solo si la cuenta es team
 */

const hasEdgeConfig = () => Boolean(process.env.EDGE_CONFIG);
const hasWriteAccess = () =>
  Boolean(process.env.EDGE_CONFIG_ID && process.env.VERCEL_API_TOKEN);

/**
 * Cache local por lambda. Edge Config tiene baja latencia pero igual evitamos
 * round-trips dentro de un mismo request.
 */
const cache = new Map<string, { value: string; ts: number }>();
const CACHE_TTL_MS = 10_000; // 10s — bajo porque las escrituras tardan ~1-3s en propagarse

async function readRaw(key: string): Promise<string | null> {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.value;
  }
  if (!hasEdgeConfig()) return null;
  try {
    const raw = await get<string>(key);
    if (raw == null) return null;
    const str = String(raw);
    cache.set(key, { value: str, ts: Date.now() });
    return str;
  } catch (e) {
    console.error("[settings] edge-config read error", key, e);
    return null;
  }
}

async function writeRaw(key: string, value: string): Promise<void> {
  cache.set(key, { value, ts: Date.now() });

  if (!hasWriteAccess()) {
    console.warn(
      "[settings] sin EDGE_CONFIG_ID o VERCEL_API_TOKEN: el cambio no persiste"
    );
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
        items: [{ operation: "upsert", key, value }],
      }),
    });
    if (!res.ok) {
      console.error(
        "[settings] edge-config write error",
        res.status,
        await res.text()
      );
    }
  } catch (e) {
    console.error("[settings] edge-config write exception", key, e);
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
 * Pre-carga todas las settings en cache con una sola llamada.
 * Llamar al inicio de Server Components / API routes que las usen.
 */
export async function preloadSettings(): Promise<void> {
  if (!hasEdgeConfig()) return;
  try {
    const all = (await getAll()) as Record<string, unknown>;
    if (!all) return;
    const now = Date.now();
    for (const [key, value] of Object.entries(all)) {
      cache.set(key, { value: String(value), ts: now });
    }
  } catch (e) {
    console.error("[settings] preload error", e);
  }
}
