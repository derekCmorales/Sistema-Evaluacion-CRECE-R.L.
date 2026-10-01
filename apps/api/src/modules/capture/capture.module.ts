import { randomUUID } from "node:crypto";
import { Global, Module } from "@nestjs/common";
import type { AuthorizationDeps, CaptureDeps, ReviewDeps } from "@crece/application";
import {
  InMemoryAuditLog,
  InMemoryDecisionLog,
  InMemoryReviewFactsPublisher,
  InMemoryOperationRepository,
  InMemoryPersonRepository,
  SeedConfigRepository,
} from "../../infrastructure/persistence/in-memory-repositories";
import { seedDemoData } from "../../infrastructure/persistence/demo-seed";
import { AUTHORIZATION_DEPS, CAPTURE_DEPS, REVIEW_DEPS, REVIEW_FACTS } from "./capture.tokens";

export function createCaptureDeps(): CaptureDeps {
  return {
    persons: new InMemoryPersonRepository(),
    operations: new InMemoryOperationRepository(),
    audit: new InMemoryAuditLog(),
    config: new SeedConfigRepository(),
    now: () => new Date().toISOString(),
    newId: () => randomUUID(),
  };
}

/**
 * Composición del proceso de crédito: un solo juego de repositorios para landing, personas,
 * operaciones, revisión (fases 4–5) y autorización (fase 7). Con `CRECE_DEMO_SEED=false`
 * arranca vacío; en producción nunca siembra.
 */
@Global()
@Module({
  providers: [
    {
      provide: CAPTURE_DEPS,
      useFactory: async (): Promise<CaptureDeps> => {
        const deps = createCaptureDeps();
        const seed = process.env.NODE_ENV !== "production" && process.env.CRECE_DEMO_SEED !== "false";
        if (seed) await seedDemoData(deps);
        return deps;
      },
    },
    { provide: REVIEW_FACTS, useFactory: () => new InMemoryReviewFactsPublisher() },
    {
      provide: REVIEW_DEPS,
      inject: [CAPTURE_DEPS, REVIEW_FACTS],
      useFactory: (deps: CaptureDeps, facts: InMemoryReviewFactsPublisher): ReviewDeps => ({ ...deps, facts }),
    },
    {
      provide: AUTHORIZATION_DEPS,
      inject: [CAPTURE_DEPS],
      useFactory: (deps: CaptureDeps): AuthorizationDeps => ({ ...deps, decisions: new InMemoryDecisionLog() }),
    },
  ],
  exports: [CAPTURE_DEPS, REVIEW_DEPS, AUTHORIZATION_DEPS, REVIEW_FACTS],
})
export class CaptureModule {}
