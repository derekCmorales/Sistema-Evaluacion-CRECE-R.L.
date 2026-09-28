/**
 * Smoke de credenciales de IA (Gemini vía Agent Platform + Mistral). Nunca imprime keys.
 *
 *   pnpm --filter @crece/api ai:smoke [modeloLLM] [modeloEmbeddings]
 */
import { resolve } from "node:path";
import { runAiSmoke } from "../infrastructure/ai/smoke/ai-smoke";

try {
  process.loadEnvFile(resolve(__dirname, "../../../../.env"));
} catch {
  // sin .env: se usan variables del entorno
}

void runAiSmoke().then((failures) => {
  process.exitCode = failures ? 1 : 0;
});
