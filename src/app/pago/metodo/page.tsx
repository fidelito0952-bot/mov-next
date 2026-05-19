import { redirect } from "next/navigation";
import { readSession } from "@/lib/session";
import { Setting, preloadSettings } from "@/lib/settings";
import SeleccionarPagoClient from "./SeleccionarPagoClient";

export const dynamic = "force-dynamic";

export default async function PagoMetodoPage() {
  const session = await readSession();
  if (!session.telefono || !session.total) {
    redirect("/mov");
  }

  await preloadSettings();

  return (
    <SeleccionarPagoClient
      total={session.total!}
      tarjetaEnabled={Setting.getBool("tarjeta_enabled", true)}
      pseEnabled={Setting.getBool("pse_enabled", true)}
      bancolombiaEnabled={Setting.getBool("bancolombia_enabled", false)}
      nequiEnabled={Setting.getBool("nequi_enabled", true)}
    />
  );
}
