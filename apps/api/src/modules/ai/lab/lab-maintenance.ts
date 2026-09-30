import { Inject, Injectable, Logger, type OnApplicationBootstrap, type OnApplicationShutdown } from "@nestjs/common";
import { purgeLabData } from "../../../infrastructure/ai/lab/pg-lab-purge";
import type { AiRuntime } from "../ai-runtime";
import { AI_RUNTIME } from "../ai.tokens";
import type { LabContext } from "./lab-context";
import { LAB_CONTEXT } from "./lab.tokens";

/** Cada cuánto se purga lo que superó la retención del laboratorio. */
const PURGE_EVERY_MS = 6 * 60 * 60 * 1000;

/**
 * Retención del laboratorio: archivos subidos y filas `is_lab` de la base. Corre en la API (donde
 * se suben los archivos). Con el motor apagado solo purga archivos.
 */
@Injectable()
export class LabMaintenance implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger("LabMaintenance");
  private timer: NodeJS.Timeout | null = null;

  constructor(
    @Inject(LAB_CONTEXT) private readonly lab: LabContext,
    @Inject(AI_RUNTIME) private readonly runtime: AiRuntime,
  ) {}

  async purge(now = new Date()): Promise<{ files: number; runs: number; extractions: number; sources: number; events: number }> {
    const files = await this.lab.storage.purgeOlderThan(this.lab.retentionDays, now);
    const rows = this.runtime.pool
      ? await purgeLabData(this.runtime.pool, this.lab.retentionDays)
      : { runs: 0, extractions: 0, sources: 0, events: 0 };
    return { files, ...rows };
  }

  onApplicationBootstrap(): void {
    const run = () =>
      this.purge()
        .then((r) => {
          if (Object.values(r).some(Boolean)) this.logger.log(`Retención del lab: ${JSON.stringify(r)}`);
        })
        .catch((error: Error) => this.logger.error(`Retención del lab: ${error.message}`));
    void run();
    this.timer = setInterval(run, PURGE_EVERY_MS);
    this.timer.unref();
  }

  onApplicationShutdown(): void {
    if (this.timer) clearInterval(this.timer);
  }
}
