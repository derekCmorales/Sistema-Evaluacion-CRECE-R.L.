import { toUserId, type Actor, type OperationSubmittedForReview } from "@crece/shared";
import type { DecisionLog, DecisionLogEntry, ReviewFactsPublisher } from "@crece/domain";
import type { AuthorizationDeps, ReviewDeps } from "../review-deps";
import { fakeCaptureDeps } from "./capture-fakes";

/**
 * Fakes de las fases 4 a 7. `failFacts` simula que nadie puede recibir el hecho del envío
 * (motor apagado o caído): el caso de uso igual debe terminar.
 */
export function fakeReviewDeps(options: { config?: Record<string, unknown>; failFacts?: boolean } = {}) {
  const base = fakeCaptureDeps(options.config);
  const facts: OperationSubmittedForReview[] = [];
  const publisher: ReviewFactsPublisher = {
    publish: async (fact) => {
      if (options.failFacts) throw new Error("motor no disponible");
      facts.push(fact);
    },
  };
  const deps: ReviewDeps = { ...base.deps, facts: publisher };
  return { ...base, deps, facts };
}

export function fakeAuthorizationDeps(config: Record<string, unknown> = {}) {
  const base = fakeCaptureDeps(config);
  const entries: DecisionLogEntry[] = [];
  const decisions: DecisionLog = {
    append: async (entry) => {
      const saved: DecisionLogEntry = { ...entry, id: `decision-${entries.length + 1}`, at: base.deps.now() };
      entries.push(saved);
      return saved;
    },
    findByOperation: async (operationId) => entries.filter((e) => e.operationId === operationId),
  };
  const deps: AuthorizationDeps = { ...base.deps, decisions };
  return { ...base, deps, decisions: entries };
}

/** Firmantes sintéticos de la fase 7. Iván tiene dos cargos: cuenta una sola vez por operación. */
export const delegatedAuthorizer: Actor = { userId: toUserId("user-ivan"), offices: ["DELEGATED_AUTHORIZER", "COUNCIL_MEMBER"] };
export const secondCouncilMember: Actor = { userId: toUserId("user-alejandro"), offices: ["COUNCIL_MEMBER"] };
