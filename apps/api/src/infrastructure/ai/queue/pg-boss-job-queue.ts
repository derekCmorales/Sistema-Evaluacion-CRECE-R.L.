import { PgBoss } from "pg-boss";
import type { AiJob, JobQueue } from "@crece/ai-engine";

export const AI_RUNS_QUEUE = "ai-runs";

export type JobHandler = (job: AiJob) => Promise<void>;

/**
 * Cola persistente sobre el mismo Postgres (esquema `ai_jobs`). Los reintentos por errores
 * del proveedor los hace el motor; pg-boss solo reintenta si el worker murió a mitad
 * (expiración), y el motor ignora ejecuciones ya terminadas.
 */
export class PgBossJobQueue implements JobQueue {
  private constructor(private readonly boss: PgBoss) {}

  static async start(connectionString: string): Promise<PgBossJobQueue> {
    const boss = new PgBoss({
      connectionString,
      schema: "ai_jobs",
      application_name: "crece-ai-jobs",
      max: 4,
    });
    boss.on("error", (error: Error) => {
      console.error(`[ai-jobs] ${error.message}`);
    });
    await boss.start();
    const existing = await boss.getQueue(AI_RUNS_QUEUE);
    if (!existing) {
      await boss.createQueue(AI_RUNS_QUEUE, {
        retryLimit: 2,
        retryDelay: 30,
        retryBackoff: true,
        expireInSeconds: 15 * 60,
        deleteAfterSeconds: 7 * 24 * 60 * 60,
      });
    }
    return new PgBossJobQueue(boss);
  }

  async enqueue(job: AiJob): Promise<void> {
    // El id del job es el id del run (UUID): encolar dos veces el mismo run choca en la
    // inserción y pg-boss lo descarta. Un reintento pedido por una persona es un run nuevo.
    await this.boss.send(AI_RUNS_QUEUE, job, { id: job.runId });
  }

  /** Solo el proceso worker consume. */
  async work(handler: JobHandler, concurrency: number): Promise<void> {
    await this.boss.work<AiJob>(AI_RUNS_QUEUE, { localConcurrency: concurrency, batchSize: 1 }, async (jobs) => {
      for (const job of jobs) await handler(job.data);
    });
  }

  async stop(): Promise<void> {
    await this.boss.stop({ graceful: true, timeout: 30_000 });
  }
}
