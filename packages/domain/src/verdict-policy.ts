import type {
  AuthorizationBand,
  AuthorizationPolicy,
  AuthorizationRoute,
  Office,
  OperationState,
  VerdictDecision,
} from "@crece/shared";
import { InvariantViolationError } from "@crece/shared";
import type { AiAlert } from "./entities";

export type Verdict = {
  byUserId: string;
  actorName?: string;
  officeCode: Office;
  decision: VerdictDecision;
  factors: string[];
  reasonText: string;
  modifiedAmount?: number;
  modifiedTermMonths?: number;
  at: string;
};

export const ORIGINATOR_FORBIDDEN_OFFICES: Office[] = [
  "DELEGATED_AUTHORIZER",
  "COUNCIL_MEMBER",
];

export function verdictOffice(verdict: Verdict): Office {
  return verdict.officeCode;
}

export function bandForAmount(
  policy: AuthorizationPolicy,
  amountGTQ: number,
): AuthorizationBand | null {
  for (const band of policy.bands) {
    if (band.maxAmountExclusive != null && amountGTQ >= band.maxAmountExclusive) {
      continue;
    }
    if (band.minAmountInclusive != null && amountGTQ < band.minAmountInclusive) {
      continue;
    }
    return band;
  }
  return null;
}

export function requiresCouncilApproval(
  amountGTQ: number,
  thresholdGTQ: number,
): boolean {
  return amountGTQ >= thresholdGTQ;
}

export function resolveRoute(
  amountGTQ: number,
  policy: AuthorizationPolicy,
): AuthorizationRoute {
  return requiresCouncilApproval(amountGTQ, policy.thresholdGTQ)
    ? "COUNCIL_QUORUM"
    : "BRANCH_DUAL_SIGNATURE";
}

export function requiredOfficesForRoute(route: AuthorizationRoute): Office[] {
  return route === "COUNCIL_QUORUM"
    ? ["COUNCIL_MEMBER"]
    : ["BRANCH_HEAD", "DELEGATED_AUTHORIZER"];
}

export function officeToExercise(
  offices: readonly Office[],
  policy: AuthorizationPolicy,
  amountGTQ: number,
  existingVerdicts: Verdict[] = [],
): Office | null {
  const band = bandForAmount(policy, amountGTQ);
  if (!band) return null;

  if (band.kind === "QUORUM") {
    const office = band.quorumOffice;
    if (!office) return null;
    return offices.includes(office) ? office : null;
  }

  const slots = band.slots ?? [];
  const filled = new Set(
    existingVerdicts
      .map(verdictOffice)
      .filter((code) => slots.some((slot) => slot.officeCode === code)),
  );

  for (const slot of slots) {
    if (filled.has(slot.officeCode)) continue;
    if (offices.includes(slot.officeCode)) return slot.officeCode;
  }
  return null;
}

export function canUserCastVerdict(
  offices: readonly Office[] | Office,
  amountGTQ: number,
  policy: AuthorizationPolicy,
): boolean {
  const list = Array.isArray(offices) ? offices : [offices];
  return officeToExercise(list, policy, amountGTQ) !== null;
}

function isApprovalDecision(decision: VerdictDecision): boolean {
  return decision === "APPROVE" || decision === "APPROVE_WITH_CHANGES";
}

export function resolveFinalDecision(
  verdicts: Verdict[],
  amountGTQ: number,
  policy: AuthorizationPolicy,
  councilMemberCount: number,
): VerdictDecision | null {
  const band = bandForAmount(policy, amountGTQ);
  if (!band || verdicts.length === 0) return null;

  if (band.kind === "QUORUM") {
    const office = band.quorumOffice ?? "COUNCIL_MEMBER";
    const votes = verdicts.filter((v) => verdictOffice(v) === office);
    if (votes.length === 0) return null;
    if (votes.some((v) => v.decision === "RETURN")) return "RETURN";

    const n = band.quorumN ?? 1;
    const m = Math.max(councilMemberCount, votes.length);
    const approvals = votes.filter((v) => isApprovalDecision(v.decision));
    if (approvals.length >= n) return "APPROVE";

    const remaining = Math.max(0, m - votes.length);
    if (approvals.length + remaining < n) return "REJECT";
    return null;
  }

  const slots = band.slots ?? [];
  const relevant = verdicts.filter((v) =>
    slots.some((slot) => slot.officeCode === verdictOffice(v)),
  );
  if (relevant.some((v) => v.decision === "RETURN")) return "RETURN";
  if (relevant.some((v) => v.decision === "REJECT")) return "REJECT";

  const approvals = relevant.filter((v) => isApprovalDecision(v.decision));
  for (const slot of slots) {
    const matching = approvals.filter((v) => verdictOffice(v) === slot.officeCode);
    if (matching.length < slot.minCount) return null;
  }
  return "APPROVE";
}

export function authorizationProgress(
  verdicts: Verdict[],
  amountGTQ: number,
  policy: AuthorizationPolicy,
  councilMemberCount: number,
): { done: number; needed: number; label: string } {
  const band = bandForAmount(policy, amountGTQ);
  if (!band) return { done: 0, needed: 0, label: "" };

  if (band.kind === "QUORUM") {
    const office = band.quorumOffice ?? "COUNCIL_MEMBER";
    const done = verdicts.filter((v) => verdictOffice(v) === office).length;
    const needed = band.quorumN ?? councilMemberCount;
    return { done, needed, label: `${done} de ${needed} votos` };
  }

  const slots = band.slots ?? [];
  const needed = slots.reduce((sum, slot) => sum + slot.minCount, 0);
  const done = slots.reduce((sum, slot) => {
    const count = verdicts.filter((v) => verdictOffice(v) === slot.officeCode).length;
    return sum + Math.min(count, slot.minCount);
  }, 0);
  return { done, needed, label: `${done} de ${needed} firmas` };
}

export function assertOnePersonOnce(verdicts: Verdict[], userId: string): void {
  if (verdicts.some((v) => v.byUserId === userId)) {
    throw new InvariantViolationError(
      "Esta persona ya emitió un veredicto en esta operación",
    );
  }
}

export function assertOriginatorCannotAuthorize(
  originatorId: string,
  actorId: string,
  officeCode: Office,
): void {
  if (actorId !== originatorId) return;
  if (ORIGINATOR_FORBIDDEN_OFFICES.includes(officeCode)) {
    throw new InvariantViolationError(
      "Quien originó o capturó no puede autorizar este caso en ese cargo",
    );
  }
}

export function assertApproveWithChangesRequiresModification(
  decision: VerdictDecision,
  modifiedAmount?: number,
  modifiedTermMonths?: number,
): void {
  if (decision !== "APPROVE_WITH_CHANGES") return;
  if (modifiedAmount == null && modifiedTermMonths == null) {
    throw new InvariantViolationError(
      "Aprobar con cambios exige monto o plazo modificado",
    );
  }
}

export function mapDecisionToState(decision: VerdictDecision): OperationState {
  switch (decision) {
    case "APPROVE":
    case "APPROVE_WITH_CHANGES":
      return "APPROVED";
    case "REJECT":
      return "REJECTED";
    case "RETURN":
      return "RETURNED_TO_ADVISOR";
  }
}

export function hasUnresolvedAiAlerts(alerts: AiAlert[]): boolean {
  return alerts.some((a) => !a.resolution);
}

export function assertCanApprove(alerts: AiAlert[]): void {
  if (hasUnresolvedAiAlerts(alerts)) {
    throw new InvariantViolationError("Hay alertas de IA sin resolver");
  }
}

/** Política de autorización: funciones puras sobre config versionada. */
export const authorizationPolicy = {
  resolveRoute,
  requiredOfficesForRoute,
  bandForAmount,
  canUserCastVerdict,
  resolveFinalDecision,
};
