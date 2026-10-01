import { describe, expect, it } from "vitest";
import { toOperationId, toUserId, type OperationSubmittedForReview } from "@crece/shared";
import { InMemoryDecisionLog, InMemoryReviewFactsPublisher } from "./in-memory-repositories";

const fact: OperationSubmittedForReview = {
  type: "OperationSubmittedForReview",
  operationId: toOperationId("op-1"),
  submittedAt: "2026-10-05T10:00:00.000Z",
  submittedBy: toUserId("user-mario"),
};

describe("adaptadores en memoria del sprint 2", () => {
  it("la bitácora de decisiones agrega y filtra por operación", async () => {
    const log = new InMemoryDecisionLog();
    await log.append({ operationId: fact.operationId, action: "VERDICT_CAST", actorUserId: toUserId("user-ivan"), actorOffice: "DELEGATED_AUTHORIZER", details: {} });
    expect(await log.findByOperation(fact.operationId)).toHaveLength(1);
    expect(await log.findByOperation(toOperationId("op-2"))).toHaveLength(0);
  });

  it("el publicador guarda el hecho y avisa a sus suscriptores", async () => {
    const publisher = new InMemoryReviewFactsPublisher();
    const seen: string[] = [];
    publisher.subscribe(async (f) => {
      seen.push(f.operationId);
    });
    await publisher.publish(fact);
    expect(publisher.history()).toEqual([fact]);
    expect(seen).toEqual(["op-1"]);
  });
});
