/**
 * Orchestrator de las reglas de antibots.
 * Equivalente a App\Services\Antibots\Detector.
 *
 * Orden de ejecución (igual a Laravel):
 *   1. BlockAll       — Fase 2
 *   2. Whitelist      — Fase 3 (return null = bypass, corta la cadena)
 *   3. Antiflood      — Fase 4
 *   4. CountryCloaker — Fase 6
 *   5. Guardian       — Fases 7-12
 *   6. MobileDetect   — Fase 5
 *
 * Devuelve:
 *   - null  → permitir (continuar al siguiente middleware/handler)
 *   - "block" | { redirect: string } → bloquear (el middleware traduce a Response)
 */

import type { NextRequest } from "next/server";
import { mergedAntibotConfig, type AntibotConfigShape } from "./config";
import { getRealIp } from "./helpers";
import { runBlockAll } from "./rules/block-all";
import { runWhitelist } from "./rules/whitelist";
import { runAntiflood } from "./rules/antiflood";
import { runCloacker } from "./rules/cloacker";
import { runGuardian } from "./rules/guardian";
import { runMobileDetect } from "./rules/mobile-detect";

export type DetectionContext = {
  req: NextRequest;
  ip: string;
  ua: string;
  url: string;
  config: AntibotConfigShape;
};

export type DetectionResult = null | "block";

export async function runDetector(req: NextRequest): Promise<DetectionResult> {
  const config = await mergedAntibotConfig();
  const ctx: DetectionContext = {
    req,
    ip: getRealIp(req),
    ua: req.headers.get("user-agent") || "",
    url: req.nextUrl.pathname + req.nextUrl.search,
    config,
  };

  // 1. BlockAll (nuclear option)
  if (await runBlockAll(ctx)) return "block";

  // 2. Whitelist — si está en whitelist, saltea TODO el resto y permite la request
  if (await runWhitelist(ctx)) return null;

  // 3. Antiflood (IP/UA blacklist: config + DB dinámica)
  if (await runAntiflood(ctx)) return "block";

  // 4. Country Cloaker (filtro por país via ip-api.com)
  if (await runCloacker(ctx)) return "block";

  // 5. Guardian (sub-reglas: anti_bots, anti_ua, anti_hn, anti_isp, anti_fingerprints, anti_proxy)
  if (await runGuardian(ctx)) return "block";

  // 6. MobileDetect (solo mobile/tablet permitido)
  if (await runMobileDetect(ctx)) return "block";

  return null;
}
