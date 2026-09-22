import { describe, expect, it } from "vitest";
import {
  InvariantViolationError,
  authorizationPolicyFromThreshold,
  type Office,
} from "@crece/shared";
import {
  assertOnePersonOnce,
  assertOriginatorCannotAuthorize,
  authorizationProgress,
  bandForAmount,
  canUserCastVerdict,
  mapDecisionToState,
  officeToExercise,
  requiresCouncilApproval,
  resolveFinalDecision,
  resolveRoute,
  type Verdict,
} from "./verdict-policy";

const policy = authorizationPolicyFromThreshold(100_000, 3);

const verdict = (
  officeCode: Office,
  decision: Verdict["decision"],
  byUserId: string,
): Verdict => ({
  byUserId,
  officeCode,
  decision,
  factors: ["PAYMENT_CAPACITY"],
  reasonText: "Demo",
  at: new Date().toISOString(),
});

describe("verdict-policy", () => {
  it("enruta bajo umbral a firmas duales y en/sobre umbral a quórum", () => {
    expect(requiresCouncilApproval(99_999, 100_000)).toBe(false);
    expect(requiresCouncilApproval(100_000, 100_000)).toBe(true);
    expect(resolveRoute(40_000, policy)).toBe("BRANCH_DUAL_SIGNATURE");
    expect(resolveRoute(150_000, policy)).toBe("COUNCIL_QUORUM");
    expect(bandForAmount(policy, 40_000)?.kind).toBe("SIGNATURES");
    expect(bandForAmount(policy, 150_000)?.kind).toBe("QUORUM");
  });

  it("deja firmar a jefatura y delegado bajo umbral, no a solo Consejo", () => {
    expect(canUserCastVerdict(["BRANCH_HEAD"], 50_000, policy)).toBe(true);
    expect(canUserCastVerdict(["DELEGATED_AUTHORIZER"], 50_000, policy)).toBe(true);
    expect(canUserCastVerdict(["COUNCIL_MEMBER"], 50_000, policy)).toBe(false);
    expect(canUserCastVerdict(["COUNCIL_MEMBER"], 150_000, policy)).toBe(true);
    expect(canUserCastVerdict(["DELEGATED_AUTHORIZER"], 150_000, policy)).toBe(
      false,
    );
  });

  it("Iván ejerce delegado bajo umbral y Consejo sobre umbral", () => {
    const ivan: Office[] = ["COUNCIL_MEMBER", "DELEGATED_AUTHORIZER"];
    expect(officeToExercise(ivan, policy, 40_000)).toBe("DELEGATED_AUTHORIZER");
    expect(officeToExercise(ivan, policy, 150_000)).toBe("COUNCIL_MEMBER");
  });

  it("no cierra menores con una sola firma", () => {
    expect(
      resolveFinalDecision(
        [verdict("BRANCH_HEAD", "APPROVE", "mario")],
        40_000,
        policy,
        3,
      ),
    ).toBeNull();
  });

  it("cierra menores solo con ambas firmas de cargos distintos", () => {
    const both = [
      verdict("BRANCH_HEAD", "APPROVE", "mario"),
      verdict("DELEGATED_AUTHORIZER", "APPROVE", "ivan"),
    ];
    expect(resolveFinalDecision(both, 40_000, policy, 3)).toBe("APPROVE");
  });

  it("devolver o rechazar cierra de inmediato en menores", () => {
    expect(
      resolveFinalDecision(
        [verdict("BRANCH_HEAD", "RETURN", "mario")],
        40_000,
        policy,
        3,
      ),
    ).toBe("RETURN");
    expect(
      resolveFinalDecision(
        [verdict("DELEGATED_AUTHORIZER", "REJECT", "ivan")],
        40_000,
        policy,
        3,
      ),
    ).toBe("REJECT");
  });

  it("no cierra Consejo con 2 de 3", () => {
    const two = [
      verdict("COUNCIL_MEMBER", "APPROVE", "julio"),
      verdict("COUNCIL_MEMBER", "APPROVE_WITH_CHANGES", "alejandro"),
    ];
    expect(resolveFinalDecision(two, 150_000, policy, 3)).toBeNull();
  });

  it("cierra Consejo a 3 de 3 contando aprobar con cambios", () => {
    const three = [
      verdict("COUNCIL_MEMBER", "APPROVE", "julio"),
      verdict("COUNCIL_MEMBER", "APPROVE_WITH_CHANGES", "alejandro"),
      verdict("COUNCIL_MEMBER", "APPROVE", "ivan"),
    ];
    expect(resolveFinalDecision(three, 150_000, policy, 3)).toBe("APPROVE");
  });

  it("rechaza Consejo cuando los votos restantes no alcanzan N", () => {
    expect(
      resolveFinalDecision(
        [verdict("COUNCIL_MEMBER", "REJECT", "julio")],
        150_000,
        policy,
        3,
      ),
    ).toBe("REJECT");
  });

  it("mapea APPROVE_WITH_CHANGES a estado APPROVED", () => {
    expect(mapDecisionToState("APPROVE_WITH_CHANGES")).toBe("APPROVED");
  });

  it("rechaza un segundo veredicto de la misma persona", () => {
    const existing = [verdict("DELEGATED_AUTHORIZER", "APPROVE", "ivan")];
    expect(() => assertOnePersonOnce(existing, "ivan")).toThrow(
      InvariantViolationError,
    );
  });

  it("bloquea al originador como delegado o Consejo, no como jefatura", () => {
    expect(() =>
      assertOriginatorCannotAuthorize("mario", "mario", "DELEGATED_AUTHORIZER"),
    ).toThrow(InvariantViolationError);
    expect(() =>
      assertOriginatorCannotAuthorize("mario", "mario", "COUNCIL_MEMBER"),
    ).toThrow(InvariantViolationError);
    expect(() =>
      assertOriginatorCannotAuthorize("mario", "mario", "BRANCH_HEAD"),
    ).not.toThrow();
  });

  it("reporta progreso de firmas y votos", () => {
    expect(
      authorizationProgress(
        [verdict("BRANCH_HEAD", "APPROVE", "mario")],
        40_000,
        policy,
        3,
      ),
    ).toMatchObject({ done: 1, needed: 2 });
    expect(
      authorizationProgress(
        [verdict("COUNCIL_MEMBER", "APPROVE", "julio")],
        150_000,
        policy,
        3,
      ),
    ).toMatchObject({ done: 1, needed: 3 });
  });
});
