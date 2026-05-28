import { Redis } from "@upstash/redis";

/**
 * Cliente Upstash Redis compartido por todo el proyecto.
 *
 * Env vars:
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 *
 * Si no están seteadas, getRedis() devuelve null y los call sites
 * deben caer a defaults / no-op (mismo patrón que el código viejo de Edge Config).
 */

let client: Redis | null = null;

export function hasRedis(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

export function getRedis(): Redis | null {
  if (client) return client;
  if (!hasRedis()) return null;
  client = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
  return client;
}
