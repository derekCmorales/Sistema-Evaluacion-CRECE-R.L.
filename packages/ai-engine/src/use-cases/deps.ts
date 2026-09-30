import type { AiEngineConfig } from "../config/engine-config";
import { AI_EVENT_SCHEMA_VERSION } from "../contracts/events";
import type {
  AiRun,
  Clock,
  Delay,
  DocumentSource,
  EngineLogger,
  ExtractionStore,
  Hasher,
  IdGenerator,
  JobQueue,
  OcrProvider,
  RunStore,
} from "../ports";

/** Puertos que necesita el motor. Los arma el composition root del anfitrión. */
export type EngineDeps = {
  runs: RunStore;
  extractions: ExtractionStore;
  jobs: JobQueue;
  documents: DocumentSource;
  ocr: OcrProvider;
  clock: Clock;
  ids: IdGenerator;
  hasher: Hasher;
  delay: Delay;
  config: AiEngineConfig;
  /** Opcional: sin logger, el motor no registra nada. */
  logger?: EngineLogger;
};

export const silentLogger: EngineLogger = { log: () => undefined };

/** Campos comunes de todo evento: id único (deduplicación del consumidor) y versión del formato. */
export function eventBase(deps: EngineDeps, run: Pick<AiRun, "id" | "isLab">, occurredAt: string) {
  return {
    eventId: deps.ids.newId(),
    schemaVersion: AI_EVENT_SCHEMA_VERSION,
    runId: run.id,
    occurredAt,
    lab: run.isLab,
  } as const;
}
