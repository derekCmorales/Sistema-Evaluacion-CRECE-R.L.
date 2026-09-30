import { ValidationError } from "@crece/shared";
import type { AcceptedRun } from "../contracts/common";
import { RetryRunCommandSchema, type RetryRunCommand } from "../contracts/commands";
import { AiEngineError, isAiEngineError } from "../contracts/errors";
import { HostFactSchema } from "../contracts/host-facts";
import type { AiRun } from "../ports";
import { eventBase, silentLogger, type EngineDeps } from "./deps";
import {
  admitExtraction,
  executeExtraction,
  extractionIdempotencyKey,
  readExtractionInput,
} from "./extract-document";
import { parseCommand } from "./parse-command";
import { assertAnyOffice, OPERATING_OFFICES } from "./permissions";

const secondsAgo = (deps: EngineDeps, seconds: number) => new Date(deps.clock.now().getTime() - seconds * 1000).toISOString();

const failedEvent = (deps: EngineDeps, run: AiRun, error: AiEngineError, at: string) =>
  ({
    type: "AiRunFailed",
    ...eventBase(deps, run, at),
    task: run.task,
    ...(run.operationId ? { operationId: run.operationId } : {}),
    ...(run.documentRef ? { documentRef: run.documentRef } : {}),
    errorCode: error.aiCode,
    retryable: error.retryable,
  }) as const;

/**
 * Lo invoca el worker por cada trabajo de la cola. Reclama la ejecución (compare-and-set con
 * plazo): una reentrega de la cola, un segundo worker o un run ya terminado no repiten trabajo.
 */
export async function executeRun(deps: EngineDeps, runId: string): Promise<void> {
  const logger = deps.logger ?? silentLogger;
  const at = deps.clock.now().toISOString();
  const run = await deps.runs.claim(runId, at, secondsAgo(deps, deps.config.runs.leaseSeconds));
  if (!run) {
    logger.log("info", "ai.run.skipped", { runId, reason: "no reclamable (terminada, en curso o inexistente)" });
    return;
  }
  logger.log("info", "ai.run.started", { runId, task: run.task, lab: run.isLab });
  try {
    switch (run.task) {
      case "EXTRACT":
        await executeExtraction(deps, run);
        return;
      default:
        throw new AiEngineError("AI_TASK_UNAVAILABLE", `La tarea ${run.task} aún no está disponible en el motor`);
    }
  } catch (error) {
    // Error no previsto dentro del caso de uso: se registra sin detalles internos en la ejecución.
    const aiError = isAiEngineError(error)
      ? error
      : new AiEngineError("AI_INTERNAL", "Error interno del motor de IA al ejecutar la tarea");
    if (!isAiEngineError(error)) {
      logger.log("error", "ai.run.internal-error", {
        runId,
        task: run.task,
        errorName: error instanceof Error ? error.name : typeof error,
        errorMessage: error instanceof Error ? error.message.slice(0, 200) : null,
      });
    }
    const failedAt = deps.clock.now().toISOString();
    await deps.runs.markFailed(
      runId,
      { errorCode: aiError.aiCode, errorMessage: aiError.message, attempts: run.attempts },
      failedAt,
      [failedEvent(deps, run, aiError, failedAt)],
    );
  }
}

/**
 * Reintento pedido por una persona: una ejecución nueva con la misma entrada y la misma clave de
 * idempotencia (la fallida queda como historial en `retryOf`). Repetir el pedido mientras la
 * nueva sigue viva devuelve la misma.
 */
export async function retryRun(deps: EngineDeps, raw: RetryRunCommand): Promise<AcceptedRun> {
  const command = parseCommand(RetryRunCommandSchema, raw);
  assertAnyOffice(command.requestedBy, OPERATING_OFFICES, "reintentar tareas de IA");
  const failed = await deps.runs.get(command.runId);
  if (!failed) throw new AiEngineError("AI_NOT_FOUND", "La ejecución no existe");
  if (failed.status !== "FAILED") throw new ValidationError("Solo se puede reintentar una ejecución fallida");
  switch (failed.task) {
    case "EXTRACT": {
      const input = readExtractionInput(failed);
      return admitExtraction(deps, {
        input,
        requestedBy: command.requestedBy.userId,
        idempotencyKey: failed.idempotencyKey ?? extractionIdempotencyKey(input.documentRef),
        retryOf: failed.id,
      });
    }
    default:
      throw new AiEngineError("AI_TASK_UNAVAILABLE", `La tarea ${failed.task} aún no está disponible en el motor`);
  }
}

/**
 * Hechos del anfitrión (fases 1–3) → comandos del motor. El anfitrión ya autorizó la acción que
 * originó el hecho (subir un documento, enviar a revisión), así que aquí no se vuelve a evaluar
 * el cargo; se registra quién la originó. Devuelve null si el hecho no dispara trabajo todavía:
 * el anfitrión muestra "Análisis de IA no disponible" (degradación, spec ai-engine-boundary).
 */
export async function handleHostFact(deps: EngineDeps, raw: unknown): Promise<AcceptedRun | null> {
  const fact = parseCommand(HostFactSchema, raw);
  switch (fact.type) {
    case "DocumentUploaded":
      return admitExtraction(deps, {
        input: {
          documentRef: fact.documentAssetId,
          documentType: fact.documentType,
          operationId: fact.operationId,
          lab: false,
        },
        requestedBy: fact.uploadedBy,
        idempotencyKey: extractionIdempotencyKey(fact.documentAssetId),
      });
    case "OperationSubmittedForReview":
    case "CaseSnapshotChanged":
      // El análisis de revisión llega con el grupo 7 de tareas.
      return null;
  }
}

/**
 * Barrido que corre el worker: una ejecución QUEUED o RUNNING que no terminó en
 * `runs.stalledAfterSeconds` (worker caído, cola que descartó el trabajo) se marca FAILED como
 * interrumpida, con su evento, para que se pueda reintentar. Nunca queda "procesando" para siempre.
 */
export async function recoverStalledRuns(deps: EngineDeps): Promise<{ interrupted: number }> {
  const logger = deps.logger ?? silentLogger;
  const cutoff = secondsAgo(deps, deps.config.runs.stalledAfterSeconds);
  const stalled = await deps.runs.findStalled({ queuedBefore: cutoff, runningBefore: cutoff, limit: 100 });
  let interrupted = 0;
  const error = new AiEngineError("AI_RUN_INTERRUPTED", "La ejecución se interrumpió antes de terminar: reinténtala");
  for (const run of stalled) {
    if (run.status !== "QUEUED" && run.status !== "RUNNING") continue;
    const at = deps.clock.now().toISOString();
    const applied = await deps.runs.markInterrupted(
      run.id,
      { status: run.status, before: cutoff },
      { errorCode: error.aiCode, errorMessage: error.message, attempts: run.attempts },
      at,
      [failedEvent(deps, run, error, at)],
    );
    if (applied) {
      interrupted += 1;
      logger.log("warn", "ai.run.interrupted", { runId: run.id, task: run.task, previousStatus: run.status });
    }
  }
  return { interrupted };
}
