import { readSession } from "@/lib/session";
import FinalizadoClient from "./FinalizadoClient";

export const dynamic = "force-dynamic";

export default async function FinalizadoPage() {
  const session = await readSession();
  return <FinalizadoClient email={session.email ?? ""} />;
}
