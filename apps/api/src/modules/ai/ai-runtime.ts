import { hostname } from "node:os";
import type { Pool } from "pg";
import {
  createAiEngine,
  createDisabledAiEngine,
  type AiEngine,
  type AiEngineConfig,
  type AiEngineStatus,
  type DocumentSource,
  type OcrProvider,
} from "@crece/ai-engine";
import type { AiEnv } from "../../infrastructure/ai/ai-env";
import { migrateAiSchema } from "../../infrastructure/ai/db/migrator";
import { loadAiEngineConfig } from "../../infrastructure/ai/db/pg-ai-config";
import { PgExtractionStore } from "../../infrastructure/ai/db/pg-extraction-store";
import { PgOutboxRelay } from "../../infrastructure/ai/db/pg-outbox-relay";
import { PgRunStore } from "../../infrastructure/ai/db/pg-run-store";
import { PgWorkerHeartbeat } from "../../infrastructure/ai/db/pg-worker-heartbeat";
import { createAiPool } from "../../infrastructure/ai/db/pool";
import { JsonEngineLogger } from "../../infrastructure/ai/logging/json-engine-logger";
import { MistralOcrProvider } from "../../infrastructure/ai/mistral/mistral-ocr-provider";
import { PgBossJobQueue } from "../../infrastructure/ai/queue/pg-boss-job-queue";
import {
  nodeHasher,
  RoutingDocumentSource,
  systemClock,
  timerDelay,
  uuidGenerator,
  type DocumentRoute,
} from "../../infrastructure/ai/runtime";
import { AiEventBus } from "./ai-event-bus";

/** Cada cuánto late el worker y cuánto sin latido significa "caído". */
const HEARTBEAT_EVERY_MS = 15_000;
const HEARTBEAT_ONLINE_SECONDS = 45;
/** Barrido de ejecuciones trabadas y purga de respuestas crudas vencidas. */
const MAINTENANCE_EVERY_MS = 60_000;
/** Pasada del relay del outbox (API). */
const RELAY_EVERY_MS = 1_000;

export type AiHealth = AiEngineStatus & {
  workersOnline: number;
  workerLastSeenAt: string | null;
};

export type AiRuntime = {
  env: AiEnv;
  engine: AiEngine;
  events: AiEventBus;
  config: AiEngineConfig | null;
  /** Conexión al esquema `ai` (null con el motor apagado). */
  pool: Pool | null;
  health(): Promise<AiHealth>;
  /** Proceso worker: consume la cola, late y hace el mantenimiento periódico. */
  startWorker(): Promise<void>;
  /** Proceso API: publica los eventos del outbox a los suscriptores del bus. */
  startRelay(): void;
  close(): Promise<void>;
};

export type AiRuntimeOptions = {
  role: "api" | "worker";
  /** Fuentes de documentos adicionales por prefijo de referencia (p. ej. almacenamiento de pruebas). */
  documentRoutes?: DocumentRoute[];
  /** Fuente de documentos del anfitrión (R2), cuando las fases 1–3 la entreguen. */
  hostDocuments?: DocumentSource;
  /** Reemplazo del OCR para pruebas de extremo a extremo (sin gastar créditos del proveedor). */
  ocr?: OcrProvider;
  /** Intervalos más cortos en pruebas. */
  intervals?: { heartbeatMs?: number; maintenanceMs?: number; relayMs?: number };
};

const DISABLED_HEALTH: AiHealth = { enabled: false, queued: 0, running: 0, oldestQueuedAt: null, workersOnline: 0, workerLastSeenAt: null };

function disabledRuntime(env: AiEnv): AiRuntime {
  return {
    env,
    engine: createDisabledAiEngine(),
    events: new AiEventBus(),
    config: null,
    pool: null,
    health: async () => DISABLED_HEALTH,
    startWorker: async () => undefined,
    startRelay: () => undefined,
    close: async () => undefined,
  };
}

/**
 * Composition root del motor de IA (design D1): el único lugar que junta el motor con Postgres,
 * la cola, los proveedores y el almacenamiento. Apagado → motor que responde AI_DISABLED.
 */
export async function composeAiRuntime(env: AiEnv, options: AiRuntimeOptions): Promise<AiRuntime> {
  if (!env.engineEnabled) return disabledRuntime(env);

  const pool = createAiPool(env.databaseUrl!);
  let queue: PgBossJobQueue | null = null;
  try {
    await migrateAiSchema(pool, env.embeddingDimensions);
    const config = await loadAiEngineConfig(pool);
    queue = await PgBossJobQueue.start(env.databaseUrl!, {
      role: options.role === "worker" ? "worker" : "producer",
      expireInSeconds: config.runs.leaseSeconds,
    });
    const logger = new JsonEngineLogger(options.role);
    const extractions = new PgExtractionStore(pool, config.extraction.rawRetentionDays);
    const engine = createAiEngine({
      runs: new PgRunStore(pool),
      extractions,
      jobs: queue,
      documents: new RoutingDocumentSource(options.documentRoutes ?? [], options.hostDocuments ?? null),
      ocr: options.ocr ?? new MistralOcrProvider(env.mistralApiKey!, config.models.ocr),
      clock: systemClock,
      ids: uuidGenerator,
      hasher: nodeHasher,
      delay: timerDelay,
      logger,
      config,
    });

    const events = new AiEventBus();
    const intervals = {
      heartbeatMs: options.intervals?.heartbeatMs ?? HEARTBEAT_EVERY_MS,
      maintenanceMs: options.intervals?.maintenanceMs ?? MAINTENANCE_EVERY_MS,
      relayMs: options.intervals?.relayMs ?? RELAY_EVERY_MS,
    };
    const timers: NodeJS.Timeout[] = [];
    let heartbeat: PgWorkerHeartbeat | null = null;
    let relayStopped = false;
    let relayRunning: Promise<void> | null = null;
    const startedQueue = queue;

    // Una tarea periódica nunca se solapa consigo misma y un error no la detiene.
    const every = (ms: number, name: string, task: () => Promise<void>) => {
      let busy = false;
      const timer = setInterval(() => {
        if (busy) return;
        busy = true;
        task()
          .catch((error: Error) => logger.log("error", `ai.${name}.error`, { errorMessage: error.message.slice(0, 200) }))
          .finally(() => {
            busy = false;
          });
      }, ms);
      timer.unref();
      timers.push(timer);
    };

    const maintenance = async () => {
      const { interrupted } = await engine.recoverStalledRuns();
      const rawPurged = await extractions.purgeExpiredRawResponses();
      if (interrupted || rawPurged) logger.log("info", "ai.maintenance", { interrupted, rawPurged });
    };

    return {
      env,
      engine,
      events,
      config,
      pool,

      async health() {
        const [status, workers] = await Promise.all([engine.status(), PgWorkerHeartbeat.online(pool, HEARTBEAT_ONLINE_SECONDS)]);
        return { ...status, workersOnline: workers.workers, workerLastSeenAt: workers.lastSeenAt };
      },

      async startWorker() {
        heartbeat = new PgWorkerHeartbeat(pool, `${hostname()}:${process.pid}`, config.runs.workerConcurrency);
        await heartbeat.beat();
        every(intervals.heartbeatMs, "heartbeat", () => heartbeat!.beat());
        await maintenance();
        every(intervals.maintenanceMs, "maintenance", maintenance);
        await startedQueue.work((job) => engine.executeRun(job.runId), config.runs.workerConcurrency);
        logger.log("info", "ai.worker.started", { concurrency: config.runs.workerConcurrency, workerId: heartbeat.workerId });
      },

      startRelay() {
        const relay = new PgOutboxRelay(pool);
        const loop = async () => {
          while (!relayStopped) {
            // Sin suscriptores no se marca nada como publicado: los eventos esperan a su consumidor.
            if (events.subscriberCount > 0) {
              try {
                const result = await relay.drain((event) => events.publish(event));
                if (result.dead) logger.log("error", "ai.outbox.dead-letter", { dead: result.dead });
                if (result.published === 20) continue; // hay más pendientes: sin esperar
              } catch (error) {
                logger.log("error", "ai.outbox.error", { errorMessage: (error as Error).message.slice(0, 200) });
              }
            }
            await new Promise((resolve) => setTimeout(resolve, intervals.relayMs).unref());
          }
        };
        relayRunning = loop();
      },

      async close() {
        relayStopped = true;
        for (const timer of timers) clearInterval(timer);
        await relayRunning;
        await startedQueue.stop();
        await heartbeat?.retire().catch(() => undefined);
        await pool.end();
      },
    };
  } catch (error) {
    await queue?.stop().catch(() => undefined);
    await pool.end().catch(() => undefined);
    throw error;
  }
}
