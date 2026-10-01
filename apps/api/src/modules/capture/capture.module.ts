import { randomUUID } from "node:crypto";
import { Global, Module } from "@nestjs/common";
import type { CaptureDeps } from "@crece/application";
import {
  InMemoryAuditLog,
  InMemoryOperationRepository,
  InMemoryPersonRepository,
  SeedConfigRepository,
} from "../../infrastructure/persistence/in-memory-repositories";
import { seedDemoData } from "../../infrastructure/persistence/demo-seed";
import { CAPTURE_DEPS } from "./capture.tokens";

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
 * Composición de la captación (fases 1–3): un solo juego de repositorios para
 * landing, personas y operaciones. Con `CRECE_DEMO_SEED=false` arranca vacío;
 * en producción nunca siembra.
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
  ],
  exports: [CAPTURE_DEPS],
})
export class CaptureModule {}
