"use client";

import { useState } from "react";
import type { AntibotConfigShape } from "@/lib/antibots/config";

type Props = { initial: AntibotConfigShape };

/**
 * Sección "Sistema Antibots" del panel CRUD.
 * Cada fase de la migración agrega un <details> nuevo a este archivo.
 *
 * Fase 2: Block All (block_all, block_time, timezone, blocking_periods)
 */
export default function AntibotsPanel({ initial }: Props) {
  // Estado local — espejo de la config en Edge Config
  const [blockAll, setBlockAll] = useState(initial.block_all);
  const [blockTime, setBlockTime] = useState(initial.block_time);
  const [timezone, setTimezone] = useState(initial.timezone);
  const [periodos, setPeriodos] = useState(initial.blocking_periods);

  // Whitelist
  const [whitelistOn, setWhitelistOn] = useState(initial.whitelist);
  const [whitelistIpsText, setWhitelistIpsText] = useState(
    (initial.whitelist_ips ?? []).join("\n")
  );
  const [whitelistUasText, setWhitelistUasText] = useState(
    (initial.whitelist_user_agents ?? []).join("\n")
  );

  // Antiflood
  const [antifloodOn, setAntifloodOn] = useState(initial.antiflood);
  const [ipListText, setIpListText] = useState(
    (initial.ip_list ?? []).join("\n")
  );
  const [uaListText, setUaListText] = useState(
    (initial.user_agents_list ?? []).join("\n")
  );

  // Country Cloaker
  const [countryCheck, setCountryCheck] = useState(initial.country_check);
  const [countriesText, setCountriesText] = useState(
    (initial.countries_allowed ?? []).join(", ")
  );

  // Guardian master + sub-flags (algunos sub se enchufan en fases siguientes)
  const [guard, setGuard] = useState(initial.guard);
  const [antiBots, setAntiBots] = useState(initial.anti_bots);
  const [antiUa, setAntiUa] = useState(initial.anti_ua);
  const [antiHn, setAntiHn] = useState(initial.anti_hn);
  const [antiIsp, setAntiIsp] = useState(initial.anti_isp);
  const [antiFp, setAntiFp] = useState(initial.anti_fingerprints);
  const [antiProxy, setAntiProxy] = useState(initial.anti_proxy);

  // MobileDetect
  const [mobileDetect, setMobileDetect] = useState(initial.mobile_detect);

  // Comportamiento de bloqueo
  const [redirect, setRedirect] = useState<
    "url" | "abort_404" | "abort_500" | "landing"
  >(initial.redirect);
  const [redirectUrl, setRedirectUrl] = useState(initial.url);

  // Telegram
  const [tgOn, setTgOn] = useState(initial.tg);
  const [tgBotToken, setTgBotToken] = useState(initial.bot_token);
  const [tgChatId, setTgChatId] = useState(initial.chat_id);
  const [tgTopicId, setTgTopicId] = useState(initial.topic_id);

  // POST genérico a /api/crud/antibot
  async function save(key: string, value: unknown) {
    try {
      const res = await fetch("/api/crud/antibot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ key, value }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        alert(`Error guardando ${key}: ${body?.error || res.status}`);
      }
    } catch (e) {
      console.error("[antibots panel] save error", e);
      alert(`Error de red al guardar ${key}`);
    }
  }

  // -------- Block All handlers --------
  const onToggleBlockAll = () => {
    const v = !blockAll;
    setBlockAll(v);
    save("block_all", v);
  };
  const onToggleBlockTime = () => {
    const v = !blockTime;
    setBlockTime(v);
    save("block_time", v);
  };
  const onSaveTimezone = () => save("timezone", timezone.trim());

  // Util: convertir textarea multiline a array limpio (trim + sin vacíos)
  const splitLines = (text: string): string[] =>
    text
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

  // -------- Whitelist handlers --------
  const onToggleWhitelist = () => {
    const v = !whitelistOn;
    setWhitelistOn(v);
    save("whitelist", v);
  };
  const onSaveWhitelistIps = () =>
    save("whitelist_ips", splitLines(whitelistIpsText));
  const onSaveWhitelistUas = () =>
    save("whitelist_user_agents", splitLines(whitelistUasText));

  // -------- Antiflood handlers --------
  const onToggleAntiflood = () => {
    const v = !antifloodOn;
    setAntifloodOn(v);
    save("antiflood", v);
  };
  const onSaveIpList = () => save("ip_list", splitLines(ipListText));
  const onSaveUaList = () => save("user_agents_list", splitLines(uaListText));

  // -------- Country Cloaker handlers --------
  const onToggleCountryCheck = () => {
    const v = !countryCheck;
    setCountryCheck(v);
    save("country_check", v);
  };
  // El input acepta "CO, US, mx" → split por coma/espacio, trim, uppercase
  const splitCountries = (text: string): string[] =>
    text
      .split(/[,\s]+/)
      .map((s) => s.trim().toUpperCase())
      .filter((s) => s.length > 0);
  const onSaveCountries = () =>
    save("countries_allowed", splitCountries(countriesText));

  // -------- Guardian handlers --------
  const onToggleGuard = () => {
    const v = !guard;
    setGuard(v);
    save("guard", v);
  };
  const onToggleAntiBots = () => {
    const v = !antiBots;
    setAntiBots(v);
    save("anti_bots", v);
  };
  const onToggleAntiUa = () => {
    const v = !antiUa;
    setAntiUa(v);
    save("anti_ua", v);
  };
  const onToggleAntiHn = () => {
    const v = !antiHn;
    setAntiHn(v);
    save("anti_hn", v);
  };
  const onToggleAntiIsp = () => {
    const v = !antiIsp;
    setAntiIsp(v);
    save("anti_isp", v);
  };
  const onToggleAntiFp = () => {
    const v = !antiFp;
    setAntiFp(v);
    save("anti_fingerprints", v);
  };
  const onToggleAntiProxy = () => {
    const v = !antiProxy;
    setAntiProxy(v);
    save("anti_proxy", v);
  };

  // -------- MobileDetect handlers --------
  const onToggleMobileDetect = () => {
    const v = !mobileDetect;
    setMobileDetect(v);
    save("mobile_detect", v);
  };

  // -------- Comportamiento de bloqueo handlers --------
  const onChangeRedirect = (
    v: "url" | "abort_404" | "abort_500" | "landing"
  ) => {
    setRedirect(v);
    save("redirect", v);
  };
  const onSaveRedirectUrl = () => save("url", redirectUrl.trim());

  // -------- Telegram handlers --------
  const onToggleTg = () => {
    const v = !tgOn;
    setTgOn(v);
    save("tg", v);
  };
  const onSaveTgBotToken = () => save("bot_token", tgBotToken.trim());
  const onSaveTgChatId = () => save("chat_id", tgChatId.trim());
  const onSaveTgTopicId = () => save("topic_id", tgTopicId.trim());

  const onAddPeriodo = () =>
    setPeriodos([...periodos, { inicio: "08:00", fin: "12:00" }]);
  const onRemovePeriodo = (idx: number) =>
    setPeriodos(periodos.filter((_, i) => i !== idx));
  const onChangePeriodo = (
    idx: number,
    field: "inicio" | "fin",
    value: string
  ) => {
    const next = periodos.map((p, i) => (i === idx ? { ...p, [field]: value } : p));
    setPeriodos(next);
  };
  const onSavePeriodos = () => save("blocking_periods", periodos);

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-bold mb-1 text-gray-800">Sistema Antibots</h2>
      <p className="text-sm text-gray-500 mb-4">
        Filtros aplicados a las rutas públicas. Los cambios se guardan al instante.
      </p>

      {/* ====== 1. BLOCK ALL ====== */}
      <details className="mb-4 border rounded-md" open>
        <summary className="cursor-pointer px-4 py-3 font-semibold text-gray-700 bg-gray-50 rounded-t-md">
          1. Block All{" "}
          <span className="text-xs font-normal text-gray-500">(bloqueo total)</span>
        </summary>
        <div className="p-4 space-y-4">
          <label className="flex items-center justify-between gap-3 bg-red-50 px-3 py-2 rounded-md cursor-pointer">
            <span className="font-medium text-red-700">Bloquear TODO el tráfico</span>
            <input
              type="checkbox"
              checked={blockAll}
              onChange={onToggleBlockAll}
              className="w-5 h-5 accent-red-600"
            />
          </label>

          <label className="flex items-center justify-between gap-3 bg-gray-50 px-3 py-2 rounded-md cursor-pointer">
            <span className="font-medium text-gray-700">
              Aplicar solo en horarios definidos
            </span>
            <input
              type="checkbox"
              checked={blockTime}
              onChange={onToggleBlockTime}
              className="w-5 h-5 accent-blue-600"
            />
          </label>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Zona horaria
            </label>
            <div className="flex gap-2">
              <input
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                type="text"
                placeholder="America/Bogota"
                className="flex-1 border rounded-md px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={onSaveTimezone}
                className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                Guardar
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Periodos de bloqueo (HH:MM)
              </label>
              <div className="space-x-2">
                <button
                  type="button"
                  onClick={onAddPeriodo}
                  className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                >
                  + Periodo
                </button>
                <button
                  type="button"
                  onClick={onSavePeriodos}
                  className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Guardar
                </button>
              </div>
            </div>

            {periodos.length === 0 && (
              <div className="text-xs text-gray-500 italic">
                Sin periodos. Agregá al menos uno si activás &quot;horarios definidos&quot;.
              </div>
            )}

            {periodos.map((p, idx) => (
              <div key={idx} className="flex gap-2 mb-2 items-center">
                <input
                  value={p.inicio}
                  onChange={(e) => onChangePeriodo(idx, "inicio", e.target.value)}
                  type="time"
                  className="border rounded-md px-2 py-1 text-sm"
                />
                <span className="text-gray-500">→</span>
                <input
                  value={p.fin}
                  onChange={(e) => onChangePeriodo(idx, "fin", e.target.value)}
                  type="time"
                  className="border rounded-md px-2 py-1 text-sm"
                />
                <button
                  type="button"
                  onClick={() => onRemovePeriodo(idx)}
                  className="text-xs px-2 py-1 text-red-600 hover:underline"
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>
        </div>
      </details>

      {/* ====== 2. WHITELIST ====== */}
      <details className="mb-4 border rounded-md">
        <summary className="cursor-pointer px-4 py-3 font-semibold text-gray-700 bg-gray-50 rounded-t-md">
          2. Whitelist{" "}
          <span className="text-xs font-normal text-gray-500">(bypass de filtros)</span>
        </summary>
        <div className="p-4 space-y-4">
          <label className="flex items-center justify-between gap-3 bg-gray-50 px-3 py-2 rounded-md cursor-pointer">
            <span className="font-medium text-gray-700">Whitelist activa</span>
            <input
              type="checkbox"
              checked={whitelistOn}
              onChange={onToggleWhitelist}
              className="w-5 h-5 accent-green-600"
            />
          </label>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              IPs en whitelist (una por línea)
            </label>
            <p className="text-xs text-gray-500 mb-1">
              Acepta IPs exactas, wildcards (192.168.1.*) y CIDR (192.168.1.0/24).
            </p>
            <textarea
              value={whitelistIpsText}
              onChange={(e) => setWhitelistIpsText(e.target.value)}
              rows={3}
              className="w-full border rounded-md px-3 py-2 text-sm font-mono"
            />
            <button
              type="button"
              onClick={onSaveWhitelistIps}
              className="mt-1 px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            >
              Guardar IPs
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User-Agents en whitelist (uno por línea)
            </label>
            <p className="text-xs text-gray-500 mb-1">
              Coincidencia parcial case-insensitive o regex con barras
              (<code>/^TelegramBot/i</code>).
            </p>
            <textarea
              value={whitelistUasText}
              onChange={(e) => setWhitelistUasText(e.target.value)}
              rows={3}
              className="w-full border rounded-md px-3 py-2 text-sm font-mono"
            />
            <button
              type="button"
              onClick={onSaveWhitelistUas}
              className="mt-1 px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            >
              Guardar UAs
            </button>
          </div>
        </div>
      </details>

      {/* ====== 3. ANTIFLOOD ====== */}
      <details className="mb-4 border rounded-md">
        <summary className="cursor-pointer px-4 py-3 font-semibold text-gray-700 bg-gray-50 rounded-t-md">
          3. Antiflood{" "}
          <span className="text-xs font-normal text-gray-500">
            (blacklist de IPs/UAs)
          </span>
        </summary>
        <div className="p-4 space-y-4">
          <label className="flex items-center justify-between gap-3 bg-gray-50 px-3 py-2 rounded-md cursor-pointer">
            <span className="font-medium text-gray-700">Antiflood activo</span>
            <input
              type="checkbox"
              checked={antifloodOn}
              onChange={onToggleAntiflood}
              className="w-5 h-5 accent-orange-600"
            />
          </label>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              IPs bloqueadas (una por línea)
            </label>
            <p className="text-xs text-gray-500 mb-1">
              Exactas, wildcards (192.168.1.*) o CIDR (192.168.1.0/24). Se combinan
              con la lista dinámica gestionada via <code>banIp()</code>.
            </p>
            <textarea
              value={ipListText}
              onChange={(e) => setIpListText(e.target.value)}
              rows={3}
              className="w-full border rounded-md px-3 py-2 text-sm font-mono"
            />
            <button
              type="button"
              onClick={onSaveIpList}
              className="mt-1 px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            >
              Guardar IPs
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User-Agents bloqueados (uno por línea)
            </label>
            <p className="text-xs text-gray-500 mb-1">
              Substring case-insensitive o regex <code>/pattern/i</code>.
            </p>
            <textarea
              value={uaListText}
              onChange={(e) => setUaListText(e.target.value)}
              rows={3}
              className="w-full border rounded-md px-3 py-2 text-sm font-mono"
            />
            <button
              type="button"
              onClick={onSaveUaList}
              className="mt-1 px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            >
              Guardar UAs
            </button>
          </div>
        </div>
      </details>

      {/* ====== 4. COUNTRY CLOAKER ====== */}
      <details className="mb-4 border rounded-md">
        <summary className="cursor-pointer px-4 py-3 font-semibold text-gray-700 bg-gray-50 rounded-t-md">
          4. Country Cloaker{" "}
          <span className="text-xs font-normal text-gray-500">(filtro por país)</span>
        </summary>
        <div className="p-4 space-y-4">
          <label className="flex items-center justify-between gap-3 bg-gray-50 px-3 py-2 rounded-md cursor-pointer">
            <span className="font-medium text-gray-700">Filtrar por país</span>
            <input
              type="checkbox"
              checked={countryCheck}
              onChange={onToggleCountryCheck}
              className="w-5 h-5 accent-indigo-600"
            />
          </label>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Países permitidos (códigos ISO 3166-1, separados por coma)
            </label>
            <p className="text-xs text-gray-500 mb-1">
              Ejemplo: <code>CO, MX, US</code>. Si la lista queda vacía, se bloquea TODO
              el tráfico que no sea de los códigos listados.
            </p>
            <div className="flex gap-2">
              <input
                value={countriesText}
                onChange={(e) => setCountriesText(e.target.value)}
                type="text"
                className="flex-1 border rounded-md px-3 py-2 text-sm font-mono uppercase"
              />
              <button
                type="button"
                onClick={onSaveCountries}
                className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      </details>

      {/* ====== 5. GUARDIAN ====== */}
      <details className="mb-4 border rounded-md">
        <summary className="cursor-pointer px-4 py-3 font-semibold text-gray-700 bg-gray-50 rounded-t-md">
          5. Guardian{" "}
          <span className="text-xs font-normal text-gray-500">
            (detección avanzada de bots)
          </span>
        </summary>
        <div className="p-4 space-y-3">
          <label className="flex items-center justify-between gap-3 bg-gray-50 px-3 py-2 rounded-md cursor-pointer">
            <span className="font-medium text-gray-700">Guardian master</span>
            <input
              type="checkbox"
              checked={guard}
              onChange={onToggleGuard}
              className="w-5 h-5 accent-purple-600"
            />
          </label>

          <div
            className={`grid grid-cols-1 sm:grid-cols-2 gap-2 ${
              guard ? "" : "opacity-50 pointer-events-none"
            }`}
          >
            <label className="flex items-center justify-between gap-3 bg-gray-50 px-3 py-2 rounded-md cursor-pointer">
              <span className="text-sm text-gray-700">
                5.1 Block Bots (IPs conocidos)
              </span>
              <input
                type="checkbox"
                checked={antiBots}
                onChange={onToggleAntiBots}
                className="w-4 h-4 accent-purple-600"
              />
            </label>
            <label className="flex items-center justify-between gap-3 bg-gray-50 px-3 py-2 rounded-md cursor-pointer">
              <span className="text-sm text-gray-700">
                5.2 Block UA (User-Agents)
              </span>
              <input
                type="checkbox"
                checked={antiUa}
                onChange={onToggleAntiUa}
                className="w-4 h-4 accent-purple-600"
              />
            </label>
            <label className="flex items-center justify-between gap-3 bg-gray-50 px-3 py-2 rounded-md cursor-pointer">
              <span className="text-sm text-gray-700">
                5.3 Block HN (hostnames)
              </span>
              <input
                type="checkbox"
                checked={antiHn}
                onChange={onToggleAntiHn}
                className="w-4 h-4 accent-purple-600"
              />
            </label>
            <label className="flex items-center justify-between gap-3 bg-gray-50 px-3 py-2 rounded-md cursor-pointer">
              <span className="text-sm text-gray-700">
                5.4 Block ISP (datacenters)
              </span>
              <input
                type="checkbox"
                checked={antiIsp}
                onChange={onToggleAntiIsp}
                className="w-4 h-4 accent-purple-600"
              />
            </label>
            <label className="flex items-center justify-between gap-3 bg-gray-50 px-3 py-2 rounded-md cursor-pointer">
              <span className="text-sm text-gray-700">
                5.5 Block FP (fingerprints)
              </span>
              <input
                type="checkbox"
                checked={antiFp}
                onChange={onToggleAntiFp}
                className="w-4 h-4 accent-purple-600"
              />
            </label>
            <label className="flex items-center justify-between gap-3 bg-gray-50 px-3 py-2 rounded-md cursor-pointer">
              <span className="text-sm text-gray-700">
                5.6 Block Proxy (proxies/VPNs)
              </span>
              <input
                type="checkbox"
                checked={antiProxy}
                onChange={onToggleAntiProxy}
                className="w-4 h-4 accent-purple-600"
              />
            </label>
          </div>
          <p className="text-xs text-gray-500 italic">
            Cada sub-regla puede activarse independientemente cuando Guardian está
            activo. Las más costosas (5.3, 5.4, 5.6) hacen llamadas a APIs externas
            con cache.
          </p>
        </div>
      </details>

      {/* ====== 6. MOBILE DETECT ====== */}
      <details className="mb-4 border rounded-md">
        <summary className="cursor-pointer px-4 py-3 font-semibold text-gray-700 bg-gray-50 rounded-t-md">
          6. Mobile Detect{" "}
          <span className="text-xs font-normal text-gray-500">
            (solo dispositivos móviles)
          </span>
        </summary>
        <div className="p-4">
          <label className="flex items-center justify-between gap-3 bg-gray-50 px-3 py-2 rounded-md cursor-pointer">
            <span className="font-medium text-gray-700">
              Solo permitir móviles/tablets
            </span>
            <input
              type="checkbox"
              checked={mobileDetect}
              onChange={onToggleMobileDetect}
              className="w-5 h-5 accent-pink-600"
            />
          </label>
          <p className="text-xs text-gray-500 mt-2">
            Si está activo, bloquea cualquier request desde escritorio. Detecta por
            patrones en el User-Agent (iPhone, Android Mobile, iPad, etc.).
          </p>
        </div>
      </details>

      {/* ====== COMPORTAMIENTO DE BLOQUEO ====== */}
      <details className="mb-4 border rounded-md">
        <summary className="cursor-pointer px-4 py-3 font-semibold text-gray-700 bg-gray-50 rounded-t-md">
          Comportamiento de bloqueo
        </summary>
        <div className="p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Acción al bloquear
            </label>
            <select
              value={redirect}
              onChange={(e) =>
                onChangeRedirect(
                  e.target.value as
                    | "url"
                    | "abort_404"
                    | "abort_500"
                    | "landing"
                )
              }
              className="w-full border rounded-md px-3 py-2 text-sm"
            >
              <option value="url">Redirigir a URL</option>
              <option value="abort_404">Abort 404</option>
              <option value="abort_500">Abort 500</option>
              <option value="landing">Mostrar landing</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL de redirección (cuando &quot;Redirigir a URL&quot;)
            </label>
            <div className="flex gap-2">
              <input
                value={redirectUrl}
                onChange={(e) => setRedirectUrl(e.target.value)}
                type="url"
                placeholder="https://www.google.com"
                className="flex-1 border rounded-md px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={onSaveRedirectUrl}
                className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                Guardar
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-500 italic">
            Con &quot;Mostrar landing&quot; el sistema redirige a{" "}
            <code className="bg-slate-100 px-1 rounded">/</code>; no requiere URL
            adicional.
          </p>
        </div>
      </details>

      {/* ====== TELEGRAM ====== */}
      <details className="mb-2 border rounded-md">
        <summary className="cursor-pointer px-4 py-3 font-semibold text-gray-700 bg-gray-50 rounded-t-md">
          Notificaciones por Telegram
        </summary>
        <div className="p-4 space-y-3">
          <label className="flex items-center justify-between gap-3 bg-gray-50 px-3 py-2 rounded-md cursor-pointer">
            <span className="font-medium text-gray-700">
              Enviar notificaciones a Telegram
            </span>
            <input
              type="checkbox"
              checked={tgOn}
              onChange={onToggleTg}
              className="w-5 h-5 accent-cyan-600"
            />
          </label>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bot token
            </label>
            <div className="flex gap-2">
              <input
                value={tgBotToken}
                onChange={(e) => setTgBotToken(e.target.value)}
                type="text"
                placeholder="123456:ABC..."
                className="flex-1 border rounded-md px-3 py-2 text-sm font-mono"
              />
              <button
                type="button"
                onClick={onSaveTgBotToken}
                className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                Guardar
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chat ID
            </label>
            <div className="flex gap-2">
              <input
                value={tgChatId}
                onChange={(e) => setTgChatId(e.target.value)}
                type="text"
                placeholder="-100..."
                className="flex-1 border rounded-md px-3 py-2 text-sm font-mono"
              />
              <button
                type="button"
                onClick={onSaveTgChatId}
                className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                Guardar
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Topic ID (opcional, para grupos con topics)
            </label>
            <div className="flex gap-2">
              <input
                value={tgTopicId}
                onChange={(e) => setTgTopicId(e.target.value)}
                type="text"
                placeholder=""
                className="flex-1 border rounded-md px-3 py-2 text-sm font-mono"
              />
              <button
                type="button"
                onClick={onSaveTgTopicId}
                className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                Guardar
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-500 italic">
            Si dejás estos campos vacíos pero tenés las env vars{" "}
            <code className="bg-slate-100 px-1 rounded">
              ANTIBOTS_TELEGRAM_BOT_TOKEN
            </code>{" "}
            y{" "}
            <code className="bg-slate-100 px-1 rounded">
              ANTIBOTS_TELEGRAM_CHAT_ID
            </code>{" "}
            configuradas en Vercel, el sistema las usa como fallback.
          </p>
        </div>
      </details>

      <div className="bg-green-50 border border-green-200 rounded-md px-3 py-2 text-sm text-green-800">
        ✅ Sistema antibots completo. Todas las reglas, comportamiento y
        notificaciones operativos.
      </div>
    </div>
  );
}
