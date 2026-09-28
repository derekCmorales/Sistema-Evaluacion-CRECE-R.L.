import { AiEngineError, isAiEngineError } from "./contracts/errors";
import type { AiEngine } from "./engine-api";
import { acceptExtraction, executeExtraction, type ExtractionDeps } from "./use-cases/extract-document";

export type AiEngineDeps = ExtractionDeps;

const TERMINAL = new Set(["SUCCEEDED", "FAILED", "REUSED"]);

/**
 * Compone el motor con sus puertos. Lo invoca solo el composition root del anfitrión
 * (`apps/api/src/modules/ai`). Crece por etapas: cada grupo agrega sus comandos.
 */
export function createAiEngine(deps: AiEngineDeps): AiEngine {
  return {
    enabled: true,

    extractDocument: (command) => acceptExtraction(deps, command),

    async executeRun(runId) {
      const run = await deps.runs.get(runId);
      // Un job viejo (run borrado) o repetido por la cola no hace nada: idempotente.
      if (!run || TERMINAL.has(run.status)) return;
      await deps.runs.markRunning(runId, deps.clock.now().toISOString());
      try {
        switch (run.task) {
          case "EXTRACT":
            await executeExtraction(deps, run);
            return;
          default:
            throw new AiEngineError("AI_PROVIDER_ERROR", `Tarea ${run.task} aún no disponible en el motor`);
        }
      } catch (error) {
        // Error no previsto dentro del caso de uso: se registra sin detalles internos.
        const aiError = isAiEngineError(error)
          ? error
          : new AiEngineError("AI_PROVIDER_ERROR", "Error inesperado al ejecutar la tarea de IA");
        const at = deps.clock.now().toISOString();
        await deps.runs.markFailed(runId, { errorCode: aiError.aiCode, errorMessage: aiError.message, attempts: run.attempts }, at, [
          {
            type: "AiRunFailed",
            runId,
            occurredAt: at,
            lab: run.isLab,
            task: run.task,
            ...(run.operationId ? { operationId: run.operationId } : {}),
            ...(run.documentRef ? { documentRef: run.documentRef } : {}),
            errorCode: aiError.aiCode,
            retryable: aiError.retryable,
          },
        ]);
      }
    },

    getRun: (runId) => deps.runs.get(runId),
    listRuns: (filter) => deps.runs.list(filter),
    getExtraction: (extractionId) => deps.extractions.get(extractionId),
  };
}
