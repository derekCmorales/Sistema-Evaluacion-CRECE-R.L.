import type {
  AiAlertResolutionStatus,
  AiEvidence,
  UserId,
  VerdictDecision,
} from "@crece/shared";
import {
  EVIDENCE_SOURCE_TYPES,
  InvariantViolationError,
  ValidationError,
} from "@crece/shared";
import type { AiAlert } from "./entities";

/** Una alerta sin evidencia no se puede mostrar: la IA debe citar de dónde sale. */
export function assertAlertHasEvidence(alert: Pick<AiAlert, "evidence" | "message">): void {
  if (!alert.message.trim()) {
    throw new ValidationError("La alerta de IA debe tener un mensaje");
  }
  if (alert.evidence.length === 0) {
    throw new InvariantViolationError("La alerta de IA debe citar al menos una evidencia");
  }
  for (const item of alert.evidence) {
    assertEvidenceShape(item);
  }
}

function assertEvidenceShape(item: AiEvidence): void {
  if (!EVIDENCE_SOURCE_TYPES.includes(item.sourceType)) {
    throw new ValidationError(`Tipo de evidencia inválido: ${String(item.sourceType)}`);
  }
  if (!item.sourceId.trim()) {
    throw new ValidationError("La evidencia debe indicar su fuente");
  }
  if (!item.quote.trim()) {
    throw new ValidationError("La evidencia debe incluir la cita");
  }
  if (item.page != null && (!Number.isInteger(item.page) || item.page < 1)) {
    throw new ValidationError("La página de la evidencia debe ser un entero ≥ 1");
  }
}

export type ResolveAiAlertInput = {
  status: AiAlertResolutionStatus;
  reason?: string;
  byUserId: UserId;
  at?: string;
};

/** Resolver es decisión humana. Descartar exige motivo; una alerta se resuelve una vez. */
export function resolveAiAlert(
  alerts: AiAlert[],
  alertId: string,
  input: ResolveAiAlertInput,
): AiAlert[] {
  const reason = input.reason?.trim();
  if (input.status === "DISMISSED" && !reason) {
    throw new ValidationError("Descartar una alerta de IA exige un motivo");
  }

  let found = false;
  const next = alerts.map((alert) => {
    if (alert.id !== alertId) return alert;
    found = true;
    if (alert.resolution) {
      throw new ValidationError("La alerta ya fue resuelta");
    }
    return {
      ...alert,
      resolution: {
        status: input.status,
        ...(reason ? { reason } : {}),
        byUserId: input.byUserId,
        at: input.at ?? new Date().toISOString(),
      },
    };
  });

  if (!found) throw new ValidationError("Alerta de IA no encontrada");
  return next;
}

export function hasUnresolvedAiAlerts(alerts: AiAlert[]): boolean {
  return alerts.some((a) => !a.resolution);
}

export function assertCanApprove(alerts: AiAlert[]): void {
  if (hasUnresolvedAiAlerts(alerts)) {
    throw new InvariantViolationError("Hay alertas de IA sin resolver");
  }
}

/** Solo aprobar exige alertas resueltas; devolver o rechazar no se bloquea. */
export function assertDecisionAllowedWithAlerts(
  decision: VerdictDecision,
  alerts: AiAlert[],
): void {
  if (decision === "APPROVE" || decision === "APPROVE_WITH_CHANGES") {
    assertCanApprove(alerts);
  }
}
