import {
  ForbiddenError,
  type AuthorizationPolicy,
  type Office,
  type VerdictDecision,
} from "@crece/shared";
import {
  assertOnePersonOnce,
  assertOriginatorCannotAuthorize,
  authorizationProgress,
  officeToExercise,
  resolveFinalDecision,
  resolveRoute,
  type Verdict,
} from "@crece/domain";

export type ResolveAuthorizationInput = {
  amountGtq: number;
  originatorId: string;
  actorId: string;
  actorOffices: Office[];
  existingVerdicts: Verdict[];
  nextVerdict: Omit<Verdict, "officeCode"> & { officeCode?: Office };
  policy: AuthorizationPolicy;
  councilMemberCount: number;
};

export function prepareVerdict(input: ResolveAuthorizationInput): Verdict {
  const officeCode =
    input.nextVerdict.officeCode ??
    officeToExercise(
      input.actorOffices,
      input.policy,
      input.amountGtq,
      input.existingVerdicts,
    );
  if (!officeCode) {
    throw new ForbiddenError(
      "El usuario no tiene un cargo que firmar o votar en esta banda",
    );
  }
  assertOnePersonOnce(input.existingVerdicts, input.actorId);
  assertOriginatorCannotAuthorize(input.originatorId, input.actorId, officeCode);
  return { ...input.nextVerdict, officeCode, byUserId: input.actorId };
}

export function summarizeAuthorization(
  verdicts: Verdict[],
  amountGtq: number,
  policy: AuthorizationPolicy,
  councilMemberCount: number,
): {
  route: ReturnType<typeof resolveRoute>;
  finalDecision: VerdictDecision | null;
  progress: ReturnType<typeof authorizationProgress>;
} {
  return {
    route: resolveRoute(amountGtq, policy),
    finalDecision: resolveFinalDecision(
      verdicts,
      amountGtq,
      policy,
      councilMemberCount,
    ),
    progress: authorizationProgress(
      verdicts,
      amountGtq,
      policy,
      councilMemberCount,
    ),
  };
}
