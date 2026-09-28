import "reflect-metadata";
import { resolve } from "node:path";
import { NestFactory } from "@nestjs/core";
import { loadAiEnv } from "./infrastructure/ai/ai-env";
import { AiModule } from "./modules/ai/ai.module";
import type { AiRuntime } from "./modules/ai/ai-runtime";
import { AI_RUNTIME } from "./modules/ai/ai.tokens";

/** Trabajos de IA simultáneos por proceso worker (OCR y LLM son lentos, no CPU). */
const CONCURRENCY = 2;
/** Cada cuánto se purga el almacenamiento del laboratorio. */
const LAB_PURGE_EVERY_MS = 6 * 60 * 60 * 1000;

/**
 * Proceso worker (design D2): misma imagen que la API, sin HTTP. Consume la cola `ai-runs`
 * y ejecuta cada run con el motor. `pnpm --filter @crece/api start:worker`
 */
async function bootstrapWorker(): Promise<void> {
  try {
    process.loadEnvFile(resolve(__dirname, "../../../.env"));
  } catch {
    // sin .env: variables del entorno
  }
  const env = loadAiEnv();
  if (!env.engineEnabled) {
    console.log("[ai-worker] AI_ENGINE_ENABLED=false: el worker no tiene nada que hacer");
    return;
  }
  const app = await NestFactory.createApplicationContext(AiModule.register(env), { logger: ["error", "warn", "log"] });
  app.enableShutdownHooks();
  const runtime = app.get<AiRuntime>(AI_RUNTIME);

  await runtime.queue!.work((job) => runtime.engine.executeRun(job.runId), CONCURRENCY);
  console.log(`[ai-worker] consumiendo la cola con concurrencia ${CONCURRENCY}`);

  if (runtime.labStorage) {
    const purge = async () => {
      const removed = await runtime.labStorage!.purgeOlderThan(env.lab.retentionDays);
      if (removed) console.log(`[ai-worker] lab: ${removed} archivo(s) purgado(s) por retención`);
    };
    await purge();
    setInterval(() => void purge().catch((e: Error) => console.error(`[ai-worker] purga: ${e.message}`)), LAB_PURGE_EVERY_MS).unref();
  }
}

void bootstrapWorker();
