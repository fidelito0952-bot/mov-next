import { getRedis } from "./redis";

const PREFIX = "mov:clicks";
const TOTAL_KEY = `${PREFIX}:total`;
const dayKey = (fecha: string) => `${PREFIX}:${fecha}`;

function fechaBogota(d = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function shiftDays(fechaISO: string, delta: number): string {
  const d = new Date(`${fechaISO}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return fechaBogota(d);
}

export async function recordClick(): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  const hoy = fechaBogota();
  try {
    const p = redis.pipeline();
    p.incr(TOTAL_KEY);
    p.incr(dayKey(hoy));
    await p.exec();
  } catch (e) {
    console.error("[clicks] record error", e);
  }
}

export type ClicksStats = {
  total: number;
  hoy: number;
  ultimos7dias: { fecha: string; count: number }[];
};

export async function getClicksStats(): Promise<ClicksStats> {
  const redis = getRedis();
  const hoy = fechaBogota();
  const fechas: string[] = [];
  for (let i = 6; i >= 0; i--) fechas.push(shiftDays(hoy, -i));

  if (!redis) {
    return {
      total: 0,
      hoy: 0,
      ultimos7dias: fechas.map((fecha) => ({ fecha, count: 0 })),
    };
  }

  try {
    const keys = [TOTAL_KEY, ...fechas.map(dayKey)];
    const raw = await redis.mget<(string | number | null)[]>(...keys);
    const toNum = (v: string | number | null) => (v == null ? 0 : Number(v) || 0);
    const total = toNum(raw[0]);
    const dias = fechas.map((fecha, i) => ({ fecha, count: toNum(raw[i + 1]) }));
    const hoyCount = dias[dias.length - 1].count;
    return { total, hoy: hoyCount, ultimos7dias: dias };
  } catch (e) {
    console.error("[clicks] stats error", e);
    return {
      total: 0,
      hoy: 0,
      ultimos7dias: fechas.map((fecha) => ({ fecha, count: 0 })),
    };
  }
}
