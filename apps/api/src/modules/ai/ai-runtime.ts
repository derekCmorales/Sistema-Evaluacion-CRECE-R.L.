import {
  createAiEngine,
  createDisabledAiEngine,
  type AiEngine,
  type AiEngineConfig,
  type DocumentSource,
  type OcrProvider,
} from "@crece/ai-engine";
import type { AiEnv } from "../../infrastructure/ai/ai-env";
import { migrateAiSchema } from "../../infrastructure/ai/db/migrator";
import { loadAiEngineConfig } from "../../infrastructure/ai/db/pg-ai-config";
import { PgExtractionStore } from "../../infrastructure/ai/db/pg-extraction-store";
import { PgRunStore } from "../../infrastructure/ai/db/pg-run-store";
import { createAiPool } from "../../infrastructure/ai/db/pool";
import { MistralOcrProvider } from "../../infrastructure/ai/mistral/mistral-ocr-provider";
import { PgBossJobQueue } from "../../infrastructure/ai/queue/pg-boss-job-queue";
import { nodeHasher, RoutingDocumentSource, systemClock, timerDelay, uuidGenerator } from "../../infrastructure/ai/runtime";
import { FileSystemDocumentSource } from "../../infrastructure/ai/storage/fs-document-source";

export type AiRuntime = {
  env: AiEnv;
  engine: AiEngine;
  /** Solo con el lab habilitado (nunca en producción). */
  labStorage: FileSystemDocumentSource | null;
  queue: PgBossJobQueue | null;
  config: AiEngineConfig | null;
  close(): Promise<void>;
};

/** Reemplazos para pruebas de extremo a extremo (sin gastar créditos del proveedor). */
export type AiRuntimeOverrides = {
  ocr?: OcrProvider;
  hostDocuments?: DocumentSource;
};

/**
 * Composition root del motor de IA (design D1): el único lugar que junta el motor con Postgres,
 * la cola, los proveedores y el almacenamiento. Apagado → motor que responde AI_DISABLED.
 */
export async function composeAiRuntime(env: AiEnv, overrides: AiRuntimeOverrides = {}): Promise<AiRuntime> {
  if (!env.engineEnabled) {
    return { env, engine: createDisabledAiEngine(), labStorage: null, queue: null, config: null, close: async () => {} };
  }

  const pool = createAiPool(env.databaseUrl!);
  let queue: PgBossJobQueue | null = null;
  try {
    await migrateAiSchema(pool, env.embeddingDimensions);
    const config = await loadAiEngineConfig(pool);
    queue = await PgBossJobQueue.start(env.databaseUrl!);
    const labStorage = env.lab.enabled ? new FileSystemDocumentSource(env.lab.storageDir) : null;
    const extractions = new PgExtractionStore(pool, config.extraction.rawRetentionDays);

    const engine = createAiEngine({
      runs: new PgRunStore(pool),
      extractions,
      jobs: queue,
      documents: new RoutingDocumentSource(labStorage, overrides.hostDocuments ?? null),
      ocr: overrides.ocr ?? new MistralOcrProvider(env.mistralApiKey!, config.models.ocr),
      clock: systemClock,
      ids: uuidGenerator,
      hasher: nodeHasher,
      delay: timerDelay,
      config,
    });

    const startedQueue = queue;
    return {
      env,
      engine,
      labStorage,
      queue: startedQueue,
      config,
      async close() {
        await startedQueue.stop();
        await pool.end();
      },
    };
  } catch (error) {
    await queue?.stop().catch(() => undefined);
    await pool.end().catch(() => undefined);
    throw error;
  }
}
