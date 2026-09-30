import type { AiEngine } from "./engine-api";
import type { EngineDeps } from "./use-cases/deps";
import { acceptExtraction } from "./use-cases/extract-document";
import { executeRun, handleHostFact, recoverStalledRuns, retryRun } from "./use-cases/run-lifecycle";

export type AiEngineDeps = EngineDeps;

/**
 * Compone el motor con sus puertos. Lo invoca solo el composition root del anfitrión
 * (`apps/api/src/modules/ai`). Crece por etapas: cada grupo agrega sus comandos.
 */
export function createAiEngine(deps: AiEngineDeps): AiEngine {
  return {
    enabled: true,
    extractDocument: (command) => acceptExtraction(deps, command),
    retryRun: (command) => retryRun(deps, command),
    handle: (fact) => handleHostFact(deps, fact),
    executeRun: (runId) => executeRun(deps, runId),
    recoverStalledRuns: () => recoverStalledRuns(deps),
    getRun: (runId) => deps.runs.get(runId),
    listRuns: (filter) => deps.runs.list(filter),
    getExtraction: (extractionId) => deps.extractions.get(extractionId),
    getExtractionByDocumentRef: (documentRef) => deps.extractions.findByDocumentRef(documentRef),
    async status() {
      return { enabled: true, ...(await deps.runs.countActive()) };
    },
  };
}
