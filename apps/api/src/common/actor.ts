import { ForbiddenError, toUserId, type Office } from "@crece/shared";
import type { IntakeActor } from "@crece/application";

const OFFICES: Office[] = [
  "ADVISOR",
  "BRANCH_HEAD",
  "DELEGATED_AUTHORIZER",
  "COUNCIL_MEMBER",
  "ADMIN_ASSISTANT",
  "OVERSIGHT",
  "SYSTEM_ADMIN",
];

/**
 * Cargo de las pruebas de servicio que no arman un actor.
 * El controlador HTTP siempre pasa el cargo de los headers.
 */
export const SERVICE_TEST_ACTOR: IntakeActor = {
  userId: toUserId("user-advisor-ana"),
  offices: ["ADVISOR"],
};

export function actorFromHeaders(
  headers: Record<string, string | string[] | undefined>,
): IntakeActor {
  const user = first(headers["x-crece-user"]);
  const officesRaw = first(headers["x-crece-offices"]);
  if (!user || !officesRaw) {
    throw new ForbiddenError(
      "Indique usuario y cargo en los encabezados x-crece-user y x-crece-offices",
    );
  }
  const offices = officesRaw
    .split(",")
    .map((office) => office.trim())
    .filter((office): office is Office => OFFICES.includes(office as Office));
  if (offices.length === 0) {
    throw new ForbiddenError("Ningún cargo reconocido");
  }
  return { userId: toUserId(user), offices };
}

function first(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() ?? "";
}
