import type { AcceptedRun } from "./contracts/common";
import type { ExtractDocumentCommand, RetryRunCommand } from "./contracts/commands";
import type { HostFact } from "./contracts/host-facts";
import type { DocumentExtraction } from "./contracts/ocr";
import { AiEngineError } from "./contracts/errors";
import type { AiRun, RunFilter } from "./ports";

export type AiEngineStatus = {
  enabled: boolean;
  queued: number;
  running: number;
  /** Creación de la ejecución en cola más antigua; sirve para detectar un worker caído. */
  oldestQueuedAt: string | null;
};

/**
 * Fachada pública del motor. El anfitrión solo habla con esto (o con hechos → eventos).
 * Crece por etapas: cada grupo de tareas agrega sus comandos aquí.
 */
export type AiEngine = {
  readonly enabled: boolean;
  /** Acepta la extracción y la encola; devuelve de inmediato. */
  extractDocument(command: ExtractDocumentCommand): Promise<AcceptedRun>;
  /** Reintenta una ejecución FAILED con la misma entrada (la fallida queda como historial). */
  retryRun(command: RetryRunCommand): Promise<AcceptedRun>;
  /**
   * Entrada única para los hechos del anfitrión (fases 1–3). Devuelve la ejecución aceptada, o
   * null si ese hecho todavía no dispara trabajo de IA.
   */
  handle(fact: HostFact): Promise<AcceptedRun | null>;
  /** Lo invoca el worker por cada trabajo de la cola. Idempotente. */
  executeRun(runId: string): Promise<void>;
  /** Barrido del worker: marca FAILED (reintentables) las ejecuciones trabadas. */
  recoverStalledRuns(): Promise<{ interrupted: number }>;
  getRun(runId: string): Promise<AiRun | null>;
  listRuns(filter: RunFilter): Promise<AiRun[]>;
  getExtraction(extractionId: string): Promise<DocumentExtraction | null>;
  /** Extracción vigente de un documento del expediente (la que el anfitrión muestra para confirmar). */
  getExtractionByDocumentRef(documentRef: string): Promise<DocumentExtraction | null>;
  status(): Promise<AiEngineStatus>;
};

const disabled = (): never => {
  throw new AiEngineError("AI_DISABLED", "El motor de IA está desactivado");
};

/** Motor apagado: el proceso de crédito sigue igual y la UI muestra "no disponible". */
export function createDisabledAiEngine(): AiEngine {
  return {
    enabled: false,
    extractDocument: async () => disabled(),
    retryRun: async () => disabled(),
    // Un hecho con el motor apagado no es un error del anfitrión: simplemente no hay trabajo.
    handle: async () => null,
    executeRun: async () => disabled(),
    recoverStalledRuns: async () => ({ interrupted: 0 }),
    getRun: async () => disabled(),
    listRuns: async () => disabled(),
    getExtraction: async () => disabled(),
    getExtractionByDocumentRef: async () => disabled(),
    status: async () => ({ enabled: false, queued: 0, running: 0, oldestQueuedAt: null }),
  };
}
