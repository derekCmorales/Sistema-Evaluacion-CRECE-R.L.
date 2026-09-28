import type { Office } from "@crece/shared";
import { AiEngineError } from "../contracts/errors";
import type { Requester } from "../contracts/common";

/** Consultar ≠ operar: Consejo y Vigilancia consultan resultados, no disparan trabajo de IA. */
export const OPERATING_OFFICES: readonly Office[] = ["ADVISOR", "BRANCH_HEAD", "ADMIN_ASSISTANT", "SYSTEM_ADMIN"];

export function assertAnyOffice(requester: Requester, allowed: readonly Office[], action: string): void {
  if (!requester.offices.some((office) => allowed.includes(office))) {
    throw new AiEngineError("AI_FORBIDDEN", `Tu cargo no permite ${action}`);
  }
}
