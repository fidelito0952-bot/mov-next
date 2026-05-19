/**
 * BlockBots — Sub-regla 1 de Guardian.
 *
 * Equivalente a App\Services\Antibots\Rules\Guard\BlockBots (PHP).
 *
 * Recorre BANNED_IPS + IPS_EXTRA (~1350 patterns) buscando match contra la IP
 * del visitante. Patterns admiten:
 *   - exact: "68.65.53.71"
 *   - wildcard: "66.249.*.*"
 *   - con prefijo `^` que se ignora (legado, equivale a wildcard): "^66.249.*.*"
 *
 * Performance: la lista se compila a regex en módulo-load (1 sola vez por
 * lambda). La comparación contra ~1350 regex tarda <2 ms en la práctica.
 */

import type { DetectionContext } from "../../detector";
import { isValidIp } from "../../helpers";
import { logDetection } from "../../log";
import { BANNED_IPS, IPS_EXTRA } from "./data/bot-ips";

type CompiledPattern =
  | { type: "exact"; ip: string; raw: string }
  | { type: "regex"; re: RegExp; raw: string };

function compilePattern(raw: string): CompiledPattern | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const hasWildcard = trimmed.includes("*");
  const hasCaret = trimmed.startsWith("^");

  if (!hasWildcard && !hasCaret) {
    return { type: "exact", ip: trimmed, raw: trimmed };
  }

  // Limpiar ^ inicial y convertir a regex
  const clean = trimmed.replace(/^\^/, "");
  // Escape dots, replace * by \d+
  const reStr = "^" + clean.replace(/\./g, "\\.").replace(/\*/g, "\\d+") + "$";
  try {
    return { type: "regex", re: new RegExp(reStr), raw: trimmed };
  } catch {
    return null;
  }
}

// Pre-compilar al cargar el módulo (una sola vez por lambda)
const COMPILED: CompiledPattern[] = [];
for (const raw of [...BANNED_IPS, ...IPS_EXTRA]) {
  const c = compilePattern(raw);
  if (c) COMPILED.push(c);
}

function findMatch(ip: string): string | null {
  for (const p of COMPILED) {
    if (p.type === "exact") {
      if (p.ip === ip) return p.raw;
    } else {
      if (p.re.test(ip)) return p.raw;
    }
  }
  return null;
}

export async function runBlockBots(ctx: DetectionContext): Promise<boolean> {
  const { ip, ua, url } = ctx;
  if (!ip || !isValidIp(ip)) return false;

  const matched = findMatch(ip);
  if (!matched) return false;

  await logDetection({
    type: "block_bots",
    ip,
    ua,
    url,
    reason: `IP match pattern bot: ${matched}`,
    extra: { matched },
  });
  return true;
}
