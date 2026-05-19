/**
 * BlockFp — Sub-regla 5 de Guardian.
 *
 * Equivalente a App\Services\Antibots\Rules\Guard\BlockFp (PHP).
 *
 * Detecta OS y Browser desde el User-Agent y bloquea:
 *   - OS obsoletos/sospechosos (Vista, 2000, Ubuntu, Chrome OS, BlackBerry, Linux, Unknown)
 *   - Navegadores obsoletos (Internet Explorer, Unknown)
 *   - Combinaciones sospechosas (XP+Firefox, Server 2003+Firefox, 7+Firefox)
 *
 * El orden de los patterns importa:
 *   - OS: más específico primero (Linux al final, después de Android/Ubuntu).
 *   - Browser: Chrome antes que Safari (Chrome's UA incluye "Safari").
 */

import type { DetectionContext } from "../../detector";
import { isValidIp } from "../../helpers";
import { logDetection } from "../../log";

const BLOCKED_OS = new Set([
  "Windows Vista",
  "Windows 2000",
  "Ubuntu",
  "Chrome OS",
  "BlackBerry",
  "Linux",
  "Unknown OS Platform",
]);

const BLOCKED_BROWSERS = new Set([
  "Internet Explorer",
  "Unknown Browser",
]);

const SUSPICIOUS_COMBINATIONS: Record<string, string[]> = {
  "Windows Server 2003/XP x64": ["Firefox"],
  "Windows 7": ["Firefox"],
  "Windows XP": ["Firefox", "Internet Explorer", "Chrome"],
};

const OS_PATTERNS: Array<[RegExp, string]> = [
  [/windows nt 10/i, "Windows 10"],
  [/windows nt 6\.3/i, "Windows 8.1"],
  [/windows nt 6\.2/i, "Windows 8"],
  [/windows nt 6\.1/i, "Windows 7"],
  [/windows nt 6\.0/i, "Windows Vista"],
  [/windows nt 5\.2/i, "Windows Server 2003/XP x64"],
  [/windows nt 5\.1/i, "Windows XP"],
  [/windows xp/i, "Windows XP"],
  [/windows nt 5\.0/i, "Windows 2000"],
  [/windows me/i, "Windows ME"],
  [/win98/i, "Windows 98"],
  [/win95/i, "Windows 95"],
  [/win16/i, "Windows 3.11"],
  [/macintosh|mac os x/i, "Mac OS X"],
  [/mac_powerpc/i, "Mac OS 9"],
  [/ubuntu/i, "Ubuntu"],
  [/android/i, "Android"],
  [/iphone/i, "iPhone"],
  [/ipod/i, "iPod"],
  [/ipad/i, "iPad"],
  [/blackberry/i, "BlackBerry"],
  [/webos/i, "Mobile"],
  [/linux/i, "Linux"], // después de Android/Ubuntu
];

const BROWSER_PATTERNS: Array<[RegExp, string]> = [
  [/msie/i, "Internet Explorer"],
  [/chrome/i, "Chrome"],
  [/firefox/i, "Firefox"],
  [/safari/i, "Safari"],
  [/opera/i, "Opera"],
  [/netscape/i, "Netscape"],
  [/maxthon/i, "Maxthon"],
  [/konqueror/i, "Konqueror"],
  [/mobile/i, "Handheld Browser"],
];

export function getOS(ua: string): string {
  for (const [re, name] of OS_PATTERNS) {
    if (re.test(ua)) return name;
  }
  return "Unknown OS Platform";
}

export function getBrowser(ua: string): string {
  for (const [re, name] of BROWSER_PATTERNS) {
    if (re.test(ua)) return name;
  }
  return "Unknown Browser";
}

function shouldBlock(os: string, browser: string): boolean {
  if (BLOCKED_OS.has(os)) return true;
  if (BLOCKED_BROWSERS.has(browser)) return true;
  const combos = SUSPICIOUS_COMBINATIONS[os];
  if (combos && combos.includes(browser)) return true;
  return false;
}

export async function runBlockFp(ctx: DetectionContext): Promise<boolean> {
  const { ip, ua, url } = ctx;
  if (!ip || !isValidIp(ip)) return false;

  const os = getOS(ua);
  const browser = getBrowser(ua);

  if (!shouldBlock(os, browser)) return false;

  await logDetection({
    type: "block_fp",
    ip,
    ua,
    url,
    reason: `fingerprint sospechoso (OS=${os}, Browser=${browser})`,
    extra: { os, browser },
  });
  return true;
}
