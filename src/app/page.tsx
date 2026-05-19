import LandingRedirect from "./LandingRedirect";

export const dynamic = "force-dynamic";

const recargas = [
  { monto: "2.000", dias: "1 día", datos: "1 GB", popular: false },
  { monto: "5.000", dias: "3 días", datos: "3 GB", popular: true },
  { monto: "10.000", dias: "7 días", datos: "8 GB + WhatsApp ilimitado", popular: false },
  { monto: "20.000", dias: "15 días", datos: "20 GB + redes sociales", popular: false },
  { monto: "40.000", dias: "30 días", datos: "50 GB + llamadas ilimitadas", popular: false },
  { monto: "70.000", dias: "30 días", datos: "Datos ilimitados + 5G", popular: false },
];

const paquetes = [
  { nombre: "WhatsApp Plus", precio: "4.900", dias: "30 días", desc: "Mensajes, llamadas y videollamadas sin consumo de datos.", icono: "💬" },
  { nombre: "Redes al Máximo", precio: "8.900", dias: "30 días", desc: "TikTok, Instagram, X y Facebook con datos sin contar.", icono: "📸" },
  { nombre: "Música sin Pausa", precio: "6.900", dias: "30 días", desc: "Spotify y YouTube Music con datos incluidos.", icono: "🎧" },
  { nombre: "Pasaporte Internacional", precio: "34.900", dias: "7 días", desc: "5 GB para usar en EE.UU., México y Europa sin sorpresas.", icono: "🌎" },
];

const pasos = [
  { n: 1, t: "Mantienes tu número", d: "Pides el NIP de portabilidad por SMS al 6041 desde tu actual operador." },
  { n: 2, t: "Eliges plan o eSIM", d: "En 90 segundos seleccionas tu plan y forma de pago." },
  { n: 3, t: "Activas en 24 horas", d: "Te avisamos por WhatsApp cuando tu línea esté lista." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <LandingRedirect />
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-black shadow-md">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M2 12c0-5.5 4.5-10 10-10s10 4.5 10 10-4.5 10-10 10S2 17.5 2 12zm10-6a6 6 0 100 12 6 6 0 000-12z" />
              </svg>
            </div>
            <div className="leading-tight">
              <div className="font-black text-slate-900 text-lg">moviRed</div>
              <div className="text-[10px] uppercase tracking-widest text-blue-600 font-bold">Telefonía móvil sin atadura</div>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-700">
            <a href="#recargas" className="hover:text-blue-700">Recarga</a>
            <a href="#paquetes" className="hover:text-blue-700">Paquetes</a>
            <a href="#pospago" className="hover:text-blue-700">Pospago</a>
            <a href="#portabilidad" className="hover:text-blue-700">Portabilidad</a>
            <a href="#cobertura" className="hover:text-blue-700">Cobertura</a>
          </nav>
          <div className="flex items-center gap-3">
            <a href="#" className="hidden md:inline text-sm text-slate-700 hover:text-slate-900">Mi línea</a>
            <a href="#recargas" className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition">Recargar ahora</a>
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-16">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-12 gap-10 items-center">
          <div className="md:col-span-7">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-400/20 border border-blue-300/30 text-blue-100 text-xs font-bold mb-5">
              ⚡ 5G activa en 28 ciudades
            </div>
            <h1 className="text-4xl md:text-5xl font-black leading-tight mb-4">
              Recarga, navega, <br />cambia cuando quieras.
            </h1>
            <p className="text-blue-100 text-lg mb-7 max-w-lg">
              Sin contratos largos, sin letra pequeña. Recarga desde $2.000 o vuélvete pospago en 90 segundos.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="#recargas" className="px-6 py-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold transition shadow-lg">Recargar ahora</a>
              <a href="#portabilidad" className="px-6 py-3 rounded-lg bg-white/10 backdrop-blur border border-white/30 hover:bg-white/20 font-bold transition">Pasarme a moviRed</a>
            </div>
          </div>

          <div className="md:col-span-5">
            <div className="bg-white rounded-2xl p-5 shadow-2xl shadow-blue-950/30 text-slate-900">
              <div className="text-xs uppercase tracking-wider font-bold text-blue-600 mb-1">Recarga en 30 segundos</div>
              <h3 className="font-black text-xl mb-4">Tu número</h3>
              <div className="flex gap-2 mb-4">
                <select className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-semibold">
                  <option>+57</option>
                </select>
                <input type="text" placeholder="300 000 0000" className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
              </div>
              <div className="text-xs font-semibold text-slate-600 mb-2">Monto</div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <button className="py-2 rounded-lg bg-slate-100 text-sm font-bold text-slate-700">$5.000</button>
                <button className="py-2 rounded-lg bg-blue-600 text-sm font-bold text-white">$10.000</button>
                <button className="py-2 rounded-lg bg-slate-100 text-sm font-bold text-slate-700">$20.000</button>
              </div>
              <button className="w-full py-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold transition">Pagar con PSE o tarjeta</button>
              <p className="text-[11px] text-slate-500 mt-3 text-center">Sin comisiones · Acreditación inmediata</p>
            </div>
          </div>
        </div>
      </section>

      <section id="recargas" className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
            <div>
              <div className="text-xs uppercase tracking-wider font-bold text-blue-600 mb-2">Tabla de recargas</div>
              <h2 className="text-3xl font-bold text-slate-900">Más datos por menos plata</h2>
            </div>
            <p className="text-sm text-slate-500 mt-2 md:mt-0">Bono extra: +30 % de datos al recargar de lunes a miércoles</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recargas.map((r) => (
              <div key={r.monto} className="relative bg-white border border-slate-200 rounded-xl p-5 hover:shadow-lg hover:border-blue-300 transition">
                {r.popular && (
                  <span className="absolute -top-2 right-4 text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-900 px-2 py-0.5 rounded">Popular</span>
                )}
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl font-black text-blue-700">$ {r.monto}</span>
                  <span className="text-xs text-slate-500">/{r.dias}</span>
                </div>
                <div className="text-sm text-slate-700 font-medium">{r.datos}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="paquetes" className="py-16 bg-slate-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-2xl mb-8">
            <div className="text-xs uppercase tracking-wider font-bold text-blue-600 mb-2">Paquetes específicos</div>
            <h2 className="text-3xl font-bold text-slate-900">Compra solo lo que usas</h2>
            <p className="text-slate-600 mt-1">Para los que viven en redes, para los que no se aguantan sin música, para los que viajan…</p>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            {paquetes.map((p) => (
              <div key={p.nombre} className="bg-white rounded-2xl p-5 border border-slate-200 flex flex-col">
                <div className="text-3xl mb-3">{p.icono}</div>
                <div className="font-bold text-slate-900 mb-1">{p.nombre}</div>
                <p className="text-xs text-slate-600 flex-1 mb-4">{p.desc}</p>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-2xl font-black text-blue-700">$ {p.precio}</span>
                  <span className="text-xs text-slate-500">/{p.dias}</span>
                </div>
                <a href="#" className="text-center text-xs font-bold py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white">Activar</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pospago" className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-xs uppercase tracking-wider font-bold text-blue-600 mb-2">¿Listo para pasar a pospago?</div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Más datos, menos preocupación</h2>
            <p className="text-slate-600 mb-6">
              Si recargas más de $25.000 al mes, te conviene un plan pospago. Te bajamos el costo y duplicamos los datos.
              Sin permanencia: te puedes salir cuando quieras.
            </p>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 mb-4">
              <div className="text-xs font-bold uppercase text-blue-700 mb-1">Plan estrella</div>
              <div className="font-black text-2xl text-slate-900 mb-1">$ 29.900<span className="text-sm font-normal text-slate-500">/mes</span></div>
              <ul className="text-sm space-y-1 text-slate-700 mt-3">
                <li>📶 60 GB en 4G/5G</li>
                <li>💬 Llamadas y SMS ilimitados</li>
                <li>📺 +10 GB para YouTube y TikTok</li>
                <li>🌎 Roaming Pacto Andino incluido</li>
              </ul>
            </div>
            <a href="#" className="inline-block px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold">Cambiarme a pospago</a>
          </div>
          <div className="bg-slate-900 text-white rounded-3xl p-8">
            <h3 className="text-xl font-bold mb-5">¿Cuánto te ahorras?</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">Si hoy recargas $40.000/mes</span>
                  <span className="font-bold text-emerald-400">Ahorras $14.100</span>
                </div>
                <div className="bg-slate-700 rounded-full h-2"><div className="h-full bg-emerald-400 rounded-full" style={{ width: "65%" }}></div></div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">Si hoy recargas $25.000/mes</span>
                  <span className="font-bold text-emerald-400">Ahorras $4.200</span>
                </div>
                <div className="bg-slate-700 rounded-full h-2"><div className="h-full bg-emerald-400 rounded-full" style={{ width: "28%" }}></div></div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">Si hoy recargas $70.000/mes</span>
                  <span className="font-bold text-emerald-400">Ahorras $32.500</span>
                </div>
                <div className="bg-slate-700 rounded-full h-2"><div className="h-full bg-emerald-400 rounded-full" style={{ width: "92%" }}></div></div>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-5">Comparado con la suma de recargas equivalentes en datos.</p>
          </div>
        </div>
      </section>

      <section id="portabilidad" className="py-16 bg-slate-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="text-xs uppercase tracking-wider font-bold text-blue-600 mb-2">Portabilidad</div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Tráete tu número en 24 horas</h2>
            <p className="text-slate-600">Lo gestionamos por ti, sin papeleo, sin visitas a oficinas.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {pasos.map((p) => (
              <div key={p.n} className="bg-white rounded-2xl p-6 border border-slate-200 relative">
                <div className="absolute -top-4 left-6 w-9 h-9 rounded-full bg-blue-600 text-white font-black flex items-center justify-center">{p.n}</div>
                <h3 className="font-bold text-slate-900 mt-3 mb-2">{p.t}</h3>
                <p className="text-sm text-slate-600">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="cobertura" className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-xs uppercase tracking-wider font-bold text-blue-600 mb-2">Cobertura</div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">12,3 millones de líneas en nuestra red</h2>
            <p className="text-slate-600 mb-6">
              Operamos red propia 4G LTE en 1.103 municipios y 5G ya activa en 28 cabeceras urbanas.
              Compartimos infraestructura rural con Cretel para llegar a zonas apartadas.
            </p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-black text-blue-700">98 %</div>
                <div className="text-xs text-slate-500">Cobertura urbana</div>
              </div>
              <div>
                <div className="text-3xl font-black text-blue-700">28</div>
                <div className="text-xs text-slate-500">Ciudades con 5G</div>
              </div>
              <div>
                <div className="text-3xl font-black text-blue-700">4.840</div>
                <div className="text-xs text-slate-500">Antenas activas</div>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-blue-600 p-6 text-white">
            <div className="text-xs uppercase tracking-wider font-bold text-blue-200 mb-2">¿Tienes cobertura?</div>
            <h3 className="font-bold text-lg mb-4">Verifica tu dirección antes de portar</h3>
            <input type="text" placeholder="Dirección o código postal" className="w-full bg-blue-700/30 border border-blue-400 rounded-lg px-3 py-3 text-sm placeholder-blue-200 mb-3" />
            <button className="w-full py-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold transition">Verificar cobertura</button>
            <p className="text-[11px] text-blue-100 mt-3">Más de 92.000 búsquedas mensuales · Datos del último relevamiento de la CRC.</p>
          </div>
        </div>
      </section>

      <footer className="bg-slate-950 text-slate-400 pt-14 pb-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-5 gap-8 mb-10">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                    <path d="M2 12c0-5.5 4.5-10 10-10s10 4.5 10 10-4.5 10-10 10S2 17.5 2 12zm10-6a6 6 0 100 12 6 6 0 000-12z" />
                  </svg>
                </div>
                <span className="font-black text-white text-lg">moviRed</span>
              </div>
              <p className="text-sm max-w-sm mb-3">Operador móvil S.A. · NIT 830.122.566-1. Vigilado por la Superintendencia de Industria y Comercio y la CRC.</p>
              <div className="flex gap-3 mt-4">
                {["F", "IG", "TT", "YT"].map((s) => (
                  <a key={s} className="w-8 h-8 rounded-full bg-slate-800 hover:bg-blue-600 transition flex items-center justify-center text-xs font-bold text-white">{s}</a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3 text-sm">Recarga y planes</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Recargar mi línea</a></li>
                <li><a href="#" className="hover:text-white">Paquetes prepago</a></li>
                <li><a href="#" className="hover:text-white">Planes pospago</a></li>
                <li><a href="#" className="hover:text-white">eSIM</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3 text-sm">Atención</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Centro de ayuda</a></li>
                <li><a href="#" className="hover:text-white">Reporte de equipo robado</a></li>
                <li><a href="#" className="hover:text-white">Cambiar plan</a></li>
                <li><a href="#" className="hover:text-white">Portabilidad</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3 text-sm">Contacto</h4>
              <ul className="space-y-2 text-sm">
                <li>#888 desde tu línea</li>
                <li>(601) 432 70 00</li>
                <li>servicio@movired.example</li>
                <li>Cl. 100 # 19-54, Bogotá</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <div>© {new Date().getFullYear()} moviRed S.A. · Operador móvil</div>
            <div className="flex gap-5">
              <a href="#" className="hover:text-white">Términos</a>
              <a href="#" className="hover:text-white">Privacidad</a>
              <a href="#" className="hover:text-white">PQR</a>
              <a href="#" className="hover:text-white">Régimen tarifario</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
