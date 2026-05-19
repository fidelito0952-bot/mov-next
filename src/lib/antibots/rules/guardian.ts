/**
 * Guardian — Regla #5 del Detector.
 *
 * Equivalente a App\Services\Antibots\Rules\GuardianService (PHP).
 *
 * Orchestrator de las 6 sub-reglas de detección avanzada. Cada sub-regla se
 * habilita independientemente vía flag de config (anti_bots, anti_ua, anti_hn,
 * anti_isp, anti_fingerprints, anti_proxy). El master `guard` apaga toda la
 * sección si está en false.
 *
 * Orden de ejecución (rápidas primero, lentas al final):
 *   1. anti_bots          — Fase 12 (IP ranges hardcoded)
 *   2. anti_ua            — Fase 11 (UA patterns hardcoded)
 *   3. anti_hn            — Fase 9  (DNS reverso via DoH)
 *   4. anti_isp           — Fase 10 (lista ISPs + API)
 *   5. anti_fingerprints  — Fase 7 (regex de OS/browser) — única activa hoy
 *   6. anti_proxy         — Fase 8  (API externa proxy)
 */

import type { DetectionContext } from "../detector";
import { runBlockBots } from "./guard/block-bots";
import { runBlockFp } from "./guard/block-fp";
import { runBlockHn } from "./guard/block-hn";
import { runBlockIsp } from "./guard/block-isp";
import { runBlockProxy } from "./guard/block-proxy";
import { runBlockUa } from "./guard/block-ua";

export async function runGuardian(ctx: DetectionContext): Promise<boolean> {
  const { config } = ctx;
  if (!config.guard) return false;

  // 1. anti_bots (BlockBots con ~1350 IP patterns hardcoded)
  if (config.anti_bots) {
    if (await runBlockBots(ctx)) return true;
  }

  // 2. anti_ua (BlockUa con BLOCKED_WORDS + BOT_PATTERNS hardcoded)
  if (config.anti_ua) {
    if (await runBlockUa(ctx)) return true;
  }

  // 3. anti_hn (BlockHn via DNS-over-HTTPS de Cloudflare)
  if (config.anti_hn) {
    if (await runBlockHn(ctx)) return true;
  }

  // 4. anti_isp (BlockIsp via extreme-ip-lookup.com)
  if (config.anti_isp) {
    if (await runBlockIsp(ctx)) return true;
  }

  // 5. anti_fingerprints (BlockFp)
  if (config.anti_fingerprints) {
    if (await runBlockFp(ctx)) return true;
  }

  // 6. anti_proxy (BlockProxy via blackbox.ipinfo.app)
  if (config.anti_proxy) {
    if (await runBlockProxy(ctx)) return true;
  }

  return false;
}
