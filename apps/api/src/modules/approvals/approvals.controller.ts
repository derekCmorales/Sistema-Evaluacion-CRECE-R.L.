import { Body, Controller, Get, Post } from "@nestjs/common";
import {
  DEFAULT_AUTHORIZATION_POLICY,
  DEFAULT_COUNCIL_QUORUM_N_SEED,
  OFFICE_LABELS,
  ValidationError,
  type Office,
  type VerdictDecision,
} from "@crece/shared";
import {
  authorizationProgress,
  resolveFinalDecision,
  resolveRoute,
  type Verdict,
} from "@crece/domain";
import { prepareVerdict, summarizeAuthorization } from "@crece/application";

@Controller("approvals")
export class ApprovalsController {
  @Get("policy")
  policy() {
    const policy = DEFAULT_AUTHORIZATION_POLICY;
    return {
      source: "seed",
      note: "Valor vivo: ConfigRepository.authorization.policy (Prisma, pendiente).",
      thresholdGTQ: policy.thresholdGTQ,
      quorumN: DEFAULT_COUNCIL_QUORUM_N_SEED,
      bands: policy.bands,
      officeLabels: OFFICE_LABELS,
      outcomes: ["APPROVE", "APPROVE_WITH_CHANGES", "REJECT", "RETURN"],
    };
  }

  @Post("resolve")
  resolve(@Body() body: ResolveBody) {
    const amountGtq = Number(body.amountGtq);
    if (!Number.isFinite(amountGtq) || amountGtq < 0) {
      throw new ValidationError("amountGtq inválido");
    }
    const policy = DEFAULT_AUTHORIZATION_POLICY;
    const councilMemberCount = Number(body.councilMemberCount ?? 3);
    const existing = (body.existingVerdicts ?? []).map(asVerdict);
    if (!body.nextVerdict) {
      return summarizeAuthorization(
        existing,
        amountGtq,
        policy,
        councilMemberCount,
      );
    }
    const prepared = prepareVerdict({
      amountGtq,
      originatorId: String(body.originatorId ?? ""),
      actorId: String(body.actorId ?? body.nextVerdict.byUserId),
      actorOffices: body.actorOffices ?? [],
      existingVerdicts: existing,
      nextVerdict: asVerdict(body.nextVerdict),
      policy,
      councilMemberCount,
    });
    const verdicts = [...existing, prepared];
    return {
      acceptedVerdict: prepared,
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
}

type ResolveBody = {
  amountGtq?: number;
  originatorId?: string;
  actorId?: string;
  actorOffices?: Office[];
  councilMemberCount?: number;
  existingVerdicts?: Partial<Verdict>[];
  nextVerdict?: Partial<Verdict>;
};

function asVerdict(raw: Partial<Verdict>): Verdict {
  const decision = raw.decision as VerdictDecision | undefined;
  if (
    decision !== "APPROVE" &&
    decision !== "APPROVE_WITH_CHANGES" &&
    decision !== "REJECT" &&
    decision !== "RETURN"
  ) {
    throw new ValidationError("decision inválida");
  }
  return {
    byUserId: String(raw.byUserId ?? ""),
    officeCode: raw.officeCode as Office,
    decision,
    factors: raw.factors ?? [],
    reasonText: String(raw.reasonText ?? ""),
    modifiedAmount: raw.modifiedAmount,
    modifiedTermMonths: raw.modifiedTermMonths,
    at: raw.at ?? new Date().toISOString(),
  };
}
