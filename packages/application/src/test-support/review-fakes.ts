import {
  DEFAULT_AUTHORIZATION_POLICY,
  toUserId,
  type Actor,
  type Office,
  type OperationSubmittedForReview,
  type UserId,
} from "@crece/shared";
import {
  DEFAULT_DECISION_FACTORS,
  type DecisionLog,
  type DecisionLogEntry,
  type ReviewFactsPublisher,
} from "@crece/domain";
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

/** Firmantes sintéticos de la fase 7. El delegado también es del Consejo: cuenta una sola vez. */
export const delegatedAuthorizer: Actor = { userId: toUserId("user-delegado"), offices: ["DELEGATED_AUTHORIZER", "COUNCIL_MEMBER"] };
export const councilMemberB: Actor = { userId: toUserId("user-consejo-b"), offices: ["COUNCIL_MEMBER"] };
export const councilMemberC: Actor = { userId: toUserId("user-consejo-c"), offices: ["COUNCIL_MEMBER"] };

const SYNTHETIC_NAMES: Record<string, string> = {
  "user-mario": "Jefatura de prueba",
  "user-julio": "Consejo A de prueba",
  "user-delegado": "Delegado de prueba",
  "user-consejo-b": "Consejo B de prueba",
  "user-consejo-c": "Consejo C de prueba",
};

export function fakeAuthorizationDeps(options: { config?: Record<string, unknown>; councilMembers?: number } = {}) {
  const base = fakeCaptureDeps(options.config);
  const entries: DecisionLogEntry[] = [];
  const decisions: DecisionLog = {
    append: async (entry) => {
      const saved: DecisionLogEntry = { ...entry, id: `decision-${entries.length + 1}`, at: base.deps.now() };
      entries.push(saved);
      return saved;
    },
    findByOperation: async (operationId) => entries.filter((e) => e.operationId === operationId),
  };
  const deps: AuthorizationDeps = {
    ...base.deps,
    decisions,
    policy: { getAuthorizationPolicy: async () => DEFAULT_AUTHORIZATION_POLICY },
    directory: {
      displayName: async (userId: UserId) => SYNTHETIC_NAMES[userId] ?? userId,
      countByOffice: async (office: Office) => (office === "COUNCIL_MEMBER" ? (options.councilMembers ?? 3) : 1),
    },
    factors: {
      findActive: async () =>
        DEFAULT_DECISION_FACTORS.filter((f) => f.active).map((f) => ({ ...f, id: f.code })),
    },
  };
  return { ...base, deps, decisions: entries };
}
