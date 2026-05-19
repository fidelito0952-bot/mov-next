import { readSession } from "@/lib/session";
import FinalizadoClient from "../finalizado/FinalizadoClient";

export const dynamic = "force-dynamic";

export default async function PendientePage() {
  const session = await readSession();
  // FinishNoBack en mov es visualmente idéntico a Finalizado: misma vista "Transacción Pendiente"
  return <FinalizadoClient email={session.email ?? ""} />;
}
