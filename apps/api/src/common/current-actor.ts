import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import { ALL_OFFICES, UnauthenticatedError, toUserId, type Actor, type Office } from "@crece/shared";
import type { Request } from "express";

export const ACTOR_USER_HEADER = "x-crece-user-id";
export const ACTOR_OFFICES_HEADER = "x-crece-offices";

/**
 * Sesión de desarrollo: el usuario y sus cargos llegan en cabeceras hasta que exista
 * el `AuthGateway` (change de autenticación). No es seguridad: no desplegar sin auth real.
 */
export function actorFromHeaders(headers: Request["headers"]): Actor {
  const userId = String(headers[ACTOR_USER_HEADER] ?? "").trim();
  const offices = String(headers[ACTOR_OFFICES_HEADER] ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter((o): o is Office => (ALL_OFFICES as string[]).includes(o));
  if (!userId || offices.length === 0) {
    throw new UnauthenticatedError();
  }
  return { userId: toUserId(userId), offices };
}

export const CurrentActor = createParamDecorator((_data: unknown, ctx: ExecutionContext): Actor =>
  actorFromHeaders(ctx.switchToHttp().getRequest<Request>().headers),
);
