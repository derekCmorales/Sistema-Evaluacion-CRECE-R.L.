import { describe, expect, it } from "vitest";
import { toOperationId, toUserId } from "@crece/shared";
import { fakeAuthorizationDeps, fakeReviewDeps } from "./review-fakes";

const fact = {
  type: "OperationSubmittedForReview" as const,
  operationId: toOperationId("op-1"),
  submittedAt: "2026-10-05T10:00:00.000Z",
  submittedBy: toUserId("user-mario"),
};

describe("fakes del sprint 2", () => {
  it("registra los hechos publicados", async () => {
    const { deps, facts } = fakeReviewDeps();
    await deps.facts.publish(fact);
    expect(facts).toEqual([fact]);
  });

  it("puede simular que el motor no recibe el hecho", async () => {
    const { deps } = fakeReviewDeps({ failFacts: true });
    await expect(deps.facts.publish(fact)).rejects.toThrow();
  });

  it("la bitácora de decisiones solo agrega", async () => {
    const { deps, decisions } = fakeAuthorizationDeps();
    await deps.decisions.append({
      operationId: toOperationId("op-1"),
      action: "VERDICT_CAST",
      actorUserId: toUserId("user-ivan"),
      actorOffice: "DELEGATED_AUTHORIZER",
      details: {},
    });
    expect(decisions).toHaveLength(1);
    expect(await deps.decisions.findByOperation(toOperationId("op-2"))).toEqual([]);
    expect("update" in deps.decisions).toBe(false);
  });
});
