import type { AiTask } from "../contracts/common";

export type Clock = {
  now(): Date;
};

/** Espera entre reintentos; inyectable para que las pruebas no duerman. */
export type Delay = {
  wait(ms: number): Promise<void>;
};

export type IdGenerator = {
  newId(): string;
};

/** SHA-256 en hex. Lo implementa la infraestructura (node:crypto); el motor no hace IO. */
export type Hasher = {
  sha256Hex(data: Uint8Array | string): string;
};

export type AiJob = {
  task: AiTask;
  runId: string;
};

/**
 * Transacción abierta por un store. Es opaca para el motor: solo la pasa de un puerto a otro
 * para que "crear la ejecución" y "encolar el trabajo" se confirmen juntos (design D2).
 */
export type Transaction = { readonly __aiTransaction: unique symbol };

/** Cola persistente: el worker ejecuta `AiEngine.executeRun(runId)`. */
export type JobQueue = {
  /** Con `tx`, el trabajo se inserta en esa transacción; encolar el mismo run dos veces no duplica. */
  enqueue(job: AiJob, tx?: Transaction): Promise<void>;
};

export type LogLevel = "info" | "warn" | "error";

/**
 * Registro estructurado del motor. `fields` nunca lleva contenido de documentos, PII ni
 * material de credenciales: solo ids, códigos, tiempos y conteos.
 */
export type EngineLogger = {
  log(level: LogLevel, event: string, fields: Record<string, string | number | boolean | null>): void;
};
