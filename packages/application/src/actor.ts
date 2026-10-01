import { ForbiddenError, type Actor } from "@crece/shared";
import { hasPermission } from "./rbac";

/** Consultar ≠ operar: cada caso de uso exige su permiso antes de tocar el repositorio. */
export function assertPermission(actor: Actor, permission: string): void {
  if (!hasPermission(actor.offices, permission)) {
    throw new ForbiddenError("Tu cargo no permite esta acción");
  }
}
