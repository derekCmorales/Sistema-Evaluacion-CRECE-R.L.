import { PgBoss } from "pg-boss";
import type { AiJob, JobQueue, Transaction } from "@crece/ai-engine";
import { pgClientOf } from "../db/pg-transaction";

export const AI_RUNS_QUEUE = "ai-runs";

export type JobHandler = (job: AiJob) => Promise<void>;

export type JobQueueOptions = {
  /**
   * `producer` (API): solo encola; no supervisa ni mantiene la cola.
   * `worker`: consume y hace el mantenimiento de pg-boss.
   */
  role: "producer" | "worker";
  /** Expiración de un trabajo en curso = plazo de reclamo del motor (`runs.leaseSeconds`). */
  expireInSeconds: number;
};

/**
 * Cola persistente sobre el mismo Postgres (esquema `ai_jobs`). Los reintentos por errores del
 * proveedor los hace el motor; pg-boss solo reintenta si el worker murió a mitad (expiración), y
 * el motor ignora ejecuciones que ya terminaron o que otro worker tiene reclamadas.
 */
export class PgBossJobQueue implements JobQueue {
  private constructor(private readonly boss: PgBoss) {}

  static async start(connectionString: string, options: JobQueueOptions): Promise<PgBossJobQueue> {
    const worker = options.role === "worker";
    const boss = new PgBoss({
      connectionString,
      schema: "ai_jobs",
      application_name: worker ? "crece-ai-worker-jobs" : "crece-ai-api-jobs",
      max: worker ? 4 : 2,
      supervise: worker,
      schedule: false,
    });
    boss.on("error", (error: Error) => {
      console.error(`[ai-jobs] ${error.message}`);
    });
    await boss.start();
    const queueOptions = {
      retryLimit: 2,
      retryDelay: 30,
      retryBackoff: true,
      expireInSeconds: options.expireInSeconds,
      deleteAfterSeconds: 7 * 24 * 60 * 60,
    };
    if (await boss.getQueue(AI_RUNS_QUEUE)) {
      // La configuración viva (plazo) manda también sobre una cola creada antes.
      await boss.updateQueue(AI_RUNS_QUEUE, queueOptions);
    } else {
      await boss.createQueue(AI_RUNS_QUEUE, queueOptions);
    }
    return new PgBossJobQueue(boss);
  }

  async enqueue(job: AiJob, tx?: Transaction): Promise<void> {
    // El id del job es el id del run (UUID): encolar dos veces el mismo run no inserta otro.
    // Con `tx`, el INSERT de pg-boss corre en la transacción que creó la ejecución.
    await this.boss.send(AI_RUNS_QUEUE, job, {
      id: job.runId,
      ...(tx ? { db: { executeSql: (text: string, values?: unknown[]) => pgClientOf(tx).query(text, values) } } : {}),
    });
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
