import type { AcceptedRun } from "./contracts/common";
import type { ExtractDocumentCommand } from "./contracts/commands";
import type { DocumentExtraction } from "./contracts/ocr";
import { AiEngineError } from "./contracts/errors";
import type { AiRun, RunFilter } from "./ports";

/**
 * Fachada pública del motor. El anfitrión solo habla con esto (o con hechos → eventos).
 * Crece por etapas: cada grupo de tareas agrega sus comandos aquí.
 */
export type AiEngine = {
  readonly enabled: boolean;
  /** Acepta la extracción y la encola; devuelve de inmediato. */
  extractDocument(command: ExtractDocumentCommand): Promise<AcceptedRun>;
  /** Lo invoca el worker por cada trabajo de la cola. Idempotente. */
  executeRun(runId: string): Promise<void>;
  getRun(runId: string): Promise<AiRun | null>;
  listRuns(filter: RunFilter): Promise<AiRun[]>;
  getExtraction(extractionId: string): Promise<DocumentExtraction | null>;
};

const disabled = (): never => {
  throw new AiEngineError("AI_DISABLED", "El motor de IA está desactivado");
};

/** Motor apagado: el proceso de crédito sigue igual y la UI muestra "no disponible". */
export function createDisabledAiEngine(): AiEngine {
  return {
    enabled: false,
    extractDocument: async () => disabled(),
    executeRun: async () => disabled(),
    getRun: async () => disabled(),
    listRuns: async () => disabled(),
    getExtraction: async () => disabled(),
  };
}
