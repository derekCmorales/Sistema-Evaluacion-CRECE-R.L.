import type { EngineLogger, LogLevel } from "@crece/ai-engine";

type Sink = (line: string) => void;

/**
 * Registro del motor en una línea JSON por evento (fácil de filtrar por `runId` en cualquier
 * agregador). El motor solo manda ids, códigos, tiempos y conteos; aquí se agrega hora y proceso.
 */
export class JsonEngineLogger implements EngineLogger {
  constructor(
    private readonly processRole: "api" | "worker",
    private readonly sinks: Record<LogLevel, Sink> = {
      info: (line) => console.log(line),
      warn: (line) => console.warn(line),
      error: (line) => console.error(line),
    },
  ) {}

  log(level: LogLevel, event: string, fields: Record<string, string | number | boolean | null>): void {
    this.sinks[level](JSON.stringify({ at: new Date().toISOString(), level, event, process: this.processRole, ...fields }));
  }
}
