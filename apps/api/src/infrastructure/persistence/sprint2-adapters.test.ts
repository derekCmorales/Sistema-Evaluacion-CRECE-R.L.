import { describe, expect, it } from "vitest";
import { toOperationId, toUserId, type OperationSubmittedForReview } from "@crece/shared";
import {
  InMemoryDecisionFactorRepository,
  InMemoryDecisionLog,
  InMemoryReviewFactsPublisher,
  InMemoryUserDirectory,
} from "./in-memory-repositories";
import { DEV_DIRECTORY_USERS } from "./dev-users";

const fact: OperationSubmittedForReview = {
  type: "OperationSubmittedForReview",
  operationId: toOperationId("op-1"),
  submittedBy: toUserId("demo-jefatura"),
  occurredAt: "2026-10-05T10:00:00.000Z",
};

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("adaptadores en memoria del sprint 2", () => {
  it("la bitácora de decisiones agrega y filtra por operación", async () => {
    const log = new InMemoryDecisionLog();
    await log.append({ operationId: fact.operationId, action: "VERDICT_CAST", actorUserId: toUserId("demo-delegado"), actorOffice: "DELEGATED_AUTHORIZER", details: {} });
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
    await flush();
    expect(publisher.history()).toEqual([fact]);
    expect(seen).toEqual(["op-1"]);
  });

  it("un suscriptor que falla no frena la publicación", async () => {
    const errors: unknown[] = [];
    const publisher = new InMemoryReviewFactsPublisher((error) => errors.push(error));
    publisher.subscribe(async () => {
      throw new Error("motor caído");
    });
    await expect(publisher.publish(fact)).resolves.toBeUndefined();
    await flush();
    expect(errors).toHaveLength(1);
  });

  it("el directorio cuenta tres miembros del Consejo para cerrar el quórum semilla", async () => {
    const directory = new InMemoryUserDirectory(DEV_DIRECTORY_USERS);
    expect(await directory.countByOffice("COUNCIL_MEMBER")).toBe(3);
    expect(await directory.displayName(toUserId("demo-delegado"))).toBe("Delegado (demo)");
  });

  it("los factores sembrados salen activos y ordenados", async () => {
    const factors = await new InMemoryDecisionFactorRepository().findActive();
    expect(factors[0]?.code).toBe("PAYMENT_CAPACITY");
    expect(factors.every((f) => f.active)).toBe(true);
  });
});
