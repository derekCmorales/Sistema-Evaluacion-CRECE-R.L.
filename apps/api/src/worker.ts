import "reflect-metadata";
import { resolve } from "node:path";
import { NestFactory } from "@nestjs/core";
import { loadAiEnv } from "./infrastructure/ai/ai-env";
import { AiModule } from "./modules/ai/ai.module";
import type { AiRuntime } from "./modules/ai/ai-runtime";
import { AI_RUNTIME } from "./modules/ai/ai.tokens";
import { createLabContext } from "./modules/ai/lab/lab-context";

/**
 * Proceso worker (design D2): misma imagen que la API, sin HTTP. Consume la cola `ai-runs`,
 * late (para que la API sepa que hay worker) y barre ejecuciones trabadas.
 *   pnpm --filter @crece/api start:worker
 * Composition root: con el lab habilitado, le da al motor la ruta para leer lo que se sube al lab.
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
  const lab = createLabContext(env);
  const app = await NestFactory.createApplicationContext(
    AiModule.register(env, { role: "worker", documentRoutes: lab ? [lab.documentRoute] : [] }),
    { logger: ["error", "warn", "log"] },
  );
  app.enableShutdownHooks();
  await app.get<AiRuntime>(AI_RUNTIME).startWorker();
}

bootstrapWorker().catch((error: Error) => {
  console.error(`[ai-worker] no pudo arrancar: ${error.message}`);
  process.exit(1);
});
