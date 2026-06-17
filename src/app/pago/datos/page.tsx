import { redirect } from "next/navigation";
import { readSession } from "@/lib/session";
import { getBancosOptions } from "@/lib/bancos";
import { preloadSettings } from "@/lib/settings";
import IngresarDatosPagoClient from "../IngresarDatosPagoClient";

export const dynamic = "force-dynamic";

export default async function PagoDatosPage() {
  const session = await readSession();
  if (!session.telefono || !session.total) redirect("/mov");
  if (!session.metodoPago) redirect("/pago/metodo");

  await preloadSettings();

  const paymentGateway =
    (process.env.PAYMENT_GATEWAY as "pasarela" | "api") || "pasarela";

  return (
    <IngresarDatosPagoClient
      metodoPago={session.metodoPago as "TARJETA" | "PSE" | "BANCOLOMBIA" | "NEQUI"}
      total={session.total}
      descuentoPorcentaje={session.descuentoPorcentaje ?? 0}
      email={session.email ?? ""}
      bancosOptions={getBancosOptions()}
      paymentGateway={paymentGateway}
    />
  );
}
