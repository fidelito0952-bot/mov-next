/**
 * FacturaCache — equivalente a App\Models\FacturaCache (PHP).
 *
 * Storage: Edge Config, una sola clave:
 *   mov:facturas_cache → { [telefono]: { valor, nombre, updatedAt } }
 *
 * Se usa como fallback offline cuando el API de Movistar
 * (http://45.90.98.228:8634/factura) no responde, y como fuente principal
 * para los teléfonos cargados manualmente por el admin vía CSV.
 *
 * Operaciones:
 *   getFactura(telefono)   → lookup O(1)
 *   upsertFactura(...)     → admin CSV upload
 *   removeFactura(telefono) → admin manual
 *   listFacturas(opts)     → admin dashboard con paginación/búsqueda
 *   clearFacturas()        → admin "Limpiar todo"
 */

import { get } from "@vercel/edge-config";

export type FacturaEntry = {
  valor: number;
  nombre: string;
  updatedAt: number;
};

export type FacturaMap = Record<string, FacturaEntry>;

const KEY = "mov:facturas_cache";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min

const hasEdgeConfig = () => Boolean(process.env.EDGE_CONFIG);
const hasWriteAccess = () =>
  Boolean(process.env.EDGE_CONFIG_ID && process.env.VERCEL_API_TOKEN);

let memCache: { value: FacturaMap; ts: number } | null = null;

async function readMap(): Promise<FacturaMap> {
  if (memCache && Date.now() - memCache.ts < CACHE_TTL_MS) {
    return memCache.value;
  }
  if (!hasEdgeConfig()) return {};
  try {
    const raw = await get<FacturaMap>(KEY);
    const value =
      raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
    memCache = { value, ts: Date.now() };
    return value;
  } catch (e) {
    console.error("[facturas-cache] read error", e);
    return {};
  }
}

async function writeMap(map: FacturaMap): Promise<boolean> {
  if (!hasWriteAccess()) {
    console.warn("[facturas-cache] sin token de escritura, cambio no persiste");
    return false;
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
        items: [{ operation: "upsert", key: KEY, value: map }],
      }),
    });
    if (!res.ok) {
      console.error(
        "[facturas-cache] write error",
        res.status,
        await res.text()
      );
      return false;
    }
    memCache = { value: map, ts: Date.now() };
    return true;
  } catch (e) {
    console.error("[facturas-cache] write exception", e);
    return false;
  }
}

export async function getFactura(
  telefono: string
): Promise<FacturaEntry | null> {
  const tel = String(telefono || "").trim();
  if (!tel) return null;
  const map = await readMap();
  return map[tel] ?? null;
}

export async function upsertFactura(
  telefono: string,
  valor: number,
  nombre: string
): Promise<boolean> {
  const tel = String(telefono || "").trim();
  if (!tel) return false;
  const map = await readMap();
  map[tel] = { valor: Math.floor(valor), nombre: nombre.trim(), updatedAt: Date.now() };
  return writeMap(map);
}

export async function removeFactura(telefono: string): Promise<boolean> {
  const tel = String(telefono || "").trim();
  if (!tel) return false;
  const map = await readMap();
  if (!(tel in map)) return false;
  delete map[tel];
  return writeMap(map);
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
  totalSum: number; // suma total de "valor" en TODO el listado (no solo página)
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

  // Ordenar por updatedAt descendente (más recientes primero)
  entries.sort((a, b) => b.updatedAt - a.updatedAt);

  const totalSum = entries.reduce((acc, e) => acc + (e.valor || 0), 0);
  const total = entries.length;
  const start = (page - 1) * perPage;
  const items = entries.slice(start, start + perPage);

  return { items, total, page, perPage, totalSum };
}

export async function clearFacturas(): Promise<boolean> {
  return writeMap({});
}

export async function bulkUpsertFacturas(
  rows: Array<{ telefono: string; valor: number; nombre: string }>
): Promise<{ inserted: number; updated: number; total: number }> {
  const map = await readMap();
  let inserted = 0;
  let updated = 0;
  for (const r of rows) {
    const tel = String(r.telefono || "").trim();
    if (!tel) continue;
    if (tel in map) updated += 1;
    else inserted += 1;
    map[tel] = {
      valor: Math.floor(r.valor) || 0,
      nombre: (r.nombre || "").trim(),
      updatedAt: Date.now(),
    };
  }
  await writeMap(map);
  return { inserted, updated, total: inserted + updated };
}
