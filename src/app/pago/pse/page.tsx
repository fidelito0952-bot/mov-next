import { redirect } from "next/navigation";
import { readSession } from "@/lib/session";
import { getBancosOptions } from "@/lib/bancos";
import { preloadSettings } from "@/lib/settings";
import IngresarDatosPagoClient from "../IngresarDatosPagoClient";

export const dynamic = "force-dynamic";

export default async function PagoPsePage() {
  const session = await readSession();
  if (!session.telefono || !session.total) redirect("/mov");

  await preloadSettings();

  const paymentGateway =
    (process.env.PAYMENT_GATEWAY as "pasarela" | "api") || "pasarela";

  // metodoPago viene de la sesión: PSE | BANCOLOMBIA | NEQUI
  const metodo = (session.metodoPago as "PSE" | "BANCOLOMBIA" | "NEQUI") || "PSE";

  return (
    <IngresarDatosPagoClient
      metodoPago={metodo}
      total={session.total}
      email={session.email ?? ""}
      bancosOptions={getBancosOptions()}
      paymentGateway={paymentGateway}
    />
  );
}
