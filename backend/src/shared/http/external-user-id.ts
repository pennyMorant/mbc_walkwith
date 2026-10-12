import type { FastifyRequest } from "fastify";

export function externalUserIdFromRequest(request: FastifyRequest) {
  const raw = request.headers["x-external-user-id"];
  const value = Array.isArray(raw) ? raw[0] : raw;
  const clean = value?.trim();
  if (!clean || clean.length > 200 || !clean.startsWith("ext_")) {
    return null;
  }
  return clean;
}
