/**
 * FacturaCache — almacenamiento en Upstash Redis usando HASH.
 *
 * Cada factura es un field dentro del hash `mov:facturas_cache`:
 *   HSET mov:facturas_cache <telefono> '{"valor":...,"nombre":"...","updatedAt":...}'
 *
 * Esto permite operaciones individuales sin leer/escribir el dataset completo,
 * eliminando el límite de tamaño de un solo key y permitiendo escalar a
 * cientos de miles de facturas sin timeouts.
 *
 * Migración automática desde el formato antiguo (SET/GET con JSON único).
 * Usa una key temporal + RENAME atómico para no perder datos si falla.
 */

import { getRedis } from "./redis";

export type FacturaEntry = {
  valor: number;
  nombre: string;
  updatedAt: number;
};

export type FacturaMap = Record<string, FacturaEntry>;

const KEY = "mov:facturas_cache";
const MIGRATE_TMP = "mov:facturas_cache_tmp";
const CACHE_TTL_MS = 5 * 60 * 1000;
const MIGRATE_BATCH = 500;
const UPSERT_BATCH = 500;

let memCache: { value: FacturaMap; ts: number } | null = null;

async function readMap(): Promise<FacturaMap> {
  if (memCache && Date.now() - memCache.ts < CACHE_TTL_MS) {
    return memCache.value;
  }

  const redis = getRedis();
  if (!redis) return {};

  try {
    // Formato HASH (actual)
    const hash = await redis
      .hgetall<Record<string, unknown>>(KEY)
      .catch(() => null);
    if (hash && typeof hash === "object" && !Array.isArray(hash)) {
      const map: FacturaMap = {};
      for (const [tel, raw] of Object.entries(hash)) {
        if (tel === "_migrated") continue;
        if (raw && typeof raw === "object" && !Array.isArray(raw)) {
          map[tel] = raw as FacturaEntry;
        }
      }
      if (Object.keys(map).length > 0) {
        memCache = { value: map, ts: Date.now() };
        return map;
      }
    }

    // Formato antiguo (SET/GET con JSON único) — migrar a HASH
    const oldRaw = await redis.get<string>(KEY).catch(() => null);
    if (!oldRaw || typeof oldRaw !== "string") return {};

    const map: FacturaMap = {};
    try {
      const parsed = JSON.parse(oldRaw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        Object.assign(map, parsed);
      }
    } catch {
      return {};
    }
    if (Object.keys(map).length === 0) return {};

    // Migrar a HASH: escribe en temp key, luego RENAME atómico
    try {
      await redis.del(MIGRATE_TMP).catch(() => {});

      const entries = Object.entries(map);
      for (let i = 0; i < entries.length; i += MIGRATE_BATCH) {
        const batch = entries.slice(i, i + MIGRATE_BATCH);
        const p = redis.pipeline();
        for (const [tel, entry] of batch) {
          p.hset(MIGRATE_TMP, { [tel]: entry });
        }
        await p.exec();
      }

      await redis.hset(MIGRATE_TMP, { _migrated: "1" });
      await redis.rename(MIGRATE_TMP, KEY);
    } catch (e) {
      console.error("[facturas-cache] migración falló, datos viejos intactos", e);
      await redis.del(MIGRATE_TMP).catch(() => {});
    }

    memCache = { value: map, ts: Date.now() };
    return map;
  } catch (e) {
    console.error("[facturas-cache] read error", e);
    return {};
  }
}

export async function getFactura(
  telefono: string
): Promise<FacturaEntry | null> {
  const tel = String(telefono || "").trim();
  if (!tel) return null;

  if (memCache && Date.now() - memCache.ts < CACHE_TTL_MS) {
    return memCache.value[tel] ?? null;
  }

  const redis = getRedis();
  if (!redis) return null;
  try {
    const raw = await redis.hget<unknown>(KEY, tel).catch(() => null);
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      return raw as FacturaEntry;
    }
    return null;
  } catch {
    return null;
  }
}

export async function upsertFactura(
  telefono: string,
  valor: number,
  nombre: string
): Promise<boolean> {
  const tel = String(telefono || "").trim();
  if (!tel) return false;

  const redis = getRedis();
  if (!redis) return false;
  try {
    const entry: FacturaEntry = {
      valor: Math.floor(valor),
      nombre: nombre.trim(),
      updatedAt: Date.now(),
    };
    await redis.hset(KEY, { [tel]: entry });

    if (memCache) {
      memCache.value[tel] = entry;
    }
    return true;
  } catch (e) {
    console.error("[facturas-cache] upsert error", e);
    return false;
  }
}

export async function removeFactura(telefono: string): Promise<boolean> {
  const tel = String(telefono || "").trim();
  if (!tel) return false;

  const redis = getRedis();
  if (!redis) return false;
  try {
    await redis.hdel(KEY, tel);
    if (memCache && tel in memCache.value) {
      delete memCache.value[tel];
    }
    return true;
  } catch (e) {
    console.error("[facturas-cache] remove error", e);
    return false;
  }
}

export type ListOptions = {
  page?: number;
  perPage?: number;
  search?: string;
};

export type ListResult = {
  items: Array<{ telefono: string } & FacturaEntry>;
  total: number;
  page: number;
  perPage: number;
  totalSum: number;
};

export async function listFacturas(
  opts: ListOptions = {}
): Promise<ListResult> {
  const page = Math.max(1, opts.page ?? 1);
  const perPage = Math.max(1, opts.perPage ?? 20);
  const search = (opts.search ?? "").trim();

  const map = await readMap();
  let entries = Object.entries(map).map(([telefono, v]) => ({
    telefono,
    ...v,
  }));

  if (search) {
    const q = search.toLowerCase();
    entries = entries.filter(
      (e) =>
        e.telefono.toLowerCase().includes(q) ||
        e.nombre.toLowerCase().includes(q)
    );
  }

  entries.sort((a, b) => b.updatedAt - a.updatedAt);

  const totalSum = entries.reduce((acc, e) => acc + (e.valor || 0), 0);
  const total = entries.length;
  const start = (page - 1) * perPage;
  const items = entries.slice(start, start + perPage);

  return { items, total, page, perPage, totalSum };
}

export async function clearFacturas(): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  try {
    await redis.del(KEY);
    memCache = { value: {}, ts: Date.now() };
    return true;
  } catch (e) {
    console.error("[facturas-cache] clear error", e);
    return false;
  }
}

export async function bulkUpsertFacturas(
  rows: Array<{ telefono: string; valor: number; nombre: string }>
): Promise<{ ok: boolean; inserted: number; updated: number; total: number }> {
  const redis = getRedis();
  if (!redis) {
    return { ok: false, inserted: 0, updated: 0, total: 0 };
  }

  const map = await readMap();
  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  const now = Date.now();

  const batch: Array<{ tel: string; entry: FacturaEntry }> = [];

  for (const r of rows) {
    const tel = String(r.telefono || "").trim();
    if (!tel) continue;
    const entry: FacturaEntry = {
      valor: Math.floor(r.valor) || 0,
      nombre: (r.nombre || "").trim(),
      updatedAt: now,
    };
    const existing = map[tel];
    if (existing) {
      if (
        existing.valor === entry.valor &&
        existing.nombre === entry.nombre
      ) {
        skipped += 1;
        continue;
      }
      updated += 1;
    } else {
      inserted += 1;
    }
    map[tel] = entry;
    batch.push({ tel, entry });
  }

  if (batch.length === 0) {
    return { ok: true, inserted: 0, updated: 0, total: 0 };
  }

  try {
    for (let i = 0; i < batch.length; i += UPSERT_BATCH) {
      const slice = batch.slice(i, i + UPSERT_BATCH);
      const pipeline = redis.pipeline();
      for (const { tel, entry } of slice) {
        pipeline.hset(KEY, { [tel]: entry });
      }
      await pipeline.exec();
    }
  } catch (e) {
    console.error("[facturas-cache] bulk write error", e);
    return { ok: false, inserted: 0, updated: 0, total: 0 };
  }

  memCache = { value: map, ts: now };
  return { ok: true, inserted, updated, total: inserted + updated };
}
