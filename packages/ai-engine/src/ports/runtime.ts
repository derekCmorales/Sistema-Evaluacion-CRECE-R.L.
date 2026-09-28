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

/** Cola persistente: el worker ejecuta `AiEngine.executeRun(runId)`. */
export type JobQueue = {
  enqueue(job: AiJob): Promise<void>;
};
