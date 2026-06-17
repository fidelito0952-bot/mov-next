import { redirect } from "next/navigation";
import { readSession } from "@/lib/session";
import DetailClient from "./DetailClient";

export const dynamic = "force-dynamic";

export default async function FacturaResumenPage() {
  const session = await readSession();
  if (!session.telefono || !session.total) {
    redirect("/mov");
  }

  return (
    <DetailClient
      id={String(session.id ?? "")}
      facturaId={session.facturaId ?? ""}
      total={session.total!}
      descuentoPorcentaje={session.descuentoPorcentaje ?? 0}
      factura_documento={session.factura_documento ?? ""}
      nombre={session.nombre ?? ""}
      expiracion={session.expiracion ?? ""}
      telefono={session.telefono!}
    />
  );
}
