import { redirect } from "next/navigation";
import { readSession } from "@/lib/session";
import LoginClient from "./LoginClient";

export const dynamic = "force-dynamic";

export default async function CrudLoginPage() {
  const session = await readSession();
  if (session.cargarAuth) redirect("/crud");
  return <LoginClient />;
}
