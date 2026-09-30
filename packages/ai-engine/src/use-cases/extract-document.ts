import { z } from "zod";
import { DocumentTypeSchema, type AcceptedRun } from "../contracts/common";
import { ExtractDocumentCommandSchema, type ExtractDocumentCommand } from "../contracts/commands";
import { AiEngineError } from "../contracts/errors";
import type { DocumentExtraction } from "../contracts/ocr";
import { IMAGE_CLASSIFICATION_SCHEMA, resolveDocumentSchema, toAnnotationSchema } from "../extraction/document-schemas";
import { buildExtraction } from "../extraction/ocr-normalizer";
import { extractionPipelineFingerprint } from "../extraction/pipeline-fingerprint";
import { preflightDocument } from "../extraction/preflight";
import { compileInjectionPatterns } from "../guards/injection-detector";
import type { AiRun } from "../ports";
import { eventBase, silentLogger, type EngineDeps } from "./deps";
import { parseCommand } from "./parse-command";
import { assertAnyOffice, OPERATING_OFFICES } from "./permissions";
import { RetriesExhaustedError, toAiEngineError, withRetries } from "./retry";

/** Lo que se guarda en `ai_run.input`: parámetros, nunca el contenido del documento. */
export const ExtractionInputSchema = z.object({
  documentRef: z.string().min(1),
  documentType: DocumentTypeSchema,
  operationId: z.string().min(1).optional(),
  lab: z.boolean(),
});
export type ExtractionInput = z.infer<typeof ExtractionInputSchema>;

export type ExtractionAdmission = {
  input: ExtractionInput;
  /** Usuario que la pidió (o que subió el documento, si la disparó un hecho del anfitrión). */
  requestedBy: string;
  idempotencyKey: string;
  retryOf?: string;
};

export const extractionIdempotencyKey = (documentRef: string) => `extract:${documentRef}`;

/**
 * Crea la ejecución y encola su trabajo en una sola transacción (design D2): nunca queda una
 * ejecución QUEUED sin trabajo, ni un trabajo sin ejecución. Si ya hay una viva con la misma
 * clave, la devuelve (idempotencia); una FAILED no bloquea: pedir de nuevo crea otra.
 */
export async function admitExtraction(deps: EngineDeps, admission: ExtractionAdmission): Promise<AcceptedRun> {
  const { input } = admission;
  const runId = deps.ids.newId();
  const { run, created } = await deps.runs.createOrGet(
    {
      id: runId,
      task: "EXTRACT",
      idempotencyKey: admission.idempotencyKey,
      ...(input.operationId ? { operationId: input.operationId } : {}),
      documentRef: input.documentRef,
      requestedBy: admission.requestedBy,
      forced: false,
      isLab: input.lab,
      input,
      ...(admission.retryOf ? { retryOf: admission.retryOf } : {}),
      createdAt: deps.clock.now().toISOString(),
    },
    (tx) => deps.jobs.enqueue({ task: "EXTRACT", runId }, tx),
  );
  (deps.logger ?? silentLogger).log("info", created ? "ai.run.accepted" : "ai.run.deduplicated", {
    runId: run.id,
    task: "EXTRACT",
    lab: input.lab,
    retryOf: admission.retryOf ?? null,
  });
  return { runId: run.id, status: run.status, reused: !created };
}

/** Comando de una persona (lab o pantalla): valida forma y permiso antes de admitir. */
export async function acceptExtraction(deps: EngineDeps, raw: ExtractDocumentCommand): Promise<AcceptedRun> {
  const command = parseCommand(ExtractDocumentCommandSchema, raw);
  assertAnyOffice(command.requestedBy, OPERATING_OFFICES, "extraer documentos");
  return admitExtraction(deps, {
    input: {
      documentRef: command.documentRef,
      documentType: command.documentType,
      ...(command.operationId ? { operationId: command.operationId } : {}),
      lab: command.lab,
    },
    requestedBy: command.requestedBy.userId,
    idempotencyKey: command.idempotencyKey ?? extractionIdempotencyKey(command.documentRef),
  });
}

/** Lee la entrada guardada de una ejecución; una entrada ilegible es un error interno, no del proveedor. */
export function readExtractionInput(run: AiRun): ExtractionInput {
  const parsed = ExtractionInputSchema.safeParse(run.input);
  if (!parsed.success) throw new AiEngineError("AI_INTERNAL", "La ejecución no tiene una entrada de extracción válida");
  return parsed.data;
}

/** Ejecuta una extracción ya reclamada por este worker (estado RUNNING). */
export async function executeExtraction(deps: EngineDeps, run: AiRun): Promise<void> {
  const logger = deps.logger ?? silentLogger;
  const input = readExtractionInput(run);
  const started = deps.clock.now();
  const elapsed = () => deps.clock.now().getTime() - started.getTime();
  const { config } = deps;

  const lostClaim = (applied: boolean) => {
    if (!applied) logger.log("warn", "ai.run.claim-lost", { runId: run.id, task: run.task });
  };

  const fail = async (error: AiEngineError, attempts: number) => {
    const at = deps.clock.now().toISOString();
    const applied = await deps.runs.markFailed(
      run.id,
      { errorCode: error.aiCode, errorMessage: error.message, attempts, latencyMs: elapsed() },
      at,
      [
        {
          type: "AiRunFailed",
          ...eventBase(deps, run, at),
          task: "EXTRACT",
          documentRef: input.documentRef,
          ...(input.operationId ? { operationId: input.operationId } : {}),
          errorCode: error.aiCode,
          retryable: error.retryable,
        },
      ],
    );
    lostClaim(applied);
    logger.log("warn", "ai.run.failed", { runId: run.id, task: "EXTRACT", errorCode: error.aiCode, attempts, latencyMs: elapsed() });
  };

  const succeed = async (extraction: DocumentExtraction, options: { reused: boolean; attempts: number; costUsd: number; providerModel?: string }) => {
    await deps.extractions.linkDocument(input.documentRef, extraction.id, input.operationId);
    const at = deps.clock.now().toISOString();
    const needsAttentionCount = extraction.candidates.filter((c) => c.needsAttention).length;
    const applied = await deps.runs.markSucceeded(
      run.id,
      {
        status: options.reused ? "REUSED" : "SUCCEEDED",
        modelId: options.providerModel ?? extraction.ocrModel,
        attempts: options.attempts,
        latencyMs: elapsed(),
        costEstimateUsd: options.costUsd,
        output: {
          extractionId: extraction.id,
          pages: extraction.pages.length,
          candidateCount: extraction.candidates.length,
          needsAttentionCount,
          injectionSuspected: extraction.injectionSuspected,
          reused: options.reused,
        },
      },
      at,
      [
        {
          type: "DocumentExtractionCompleted",
          ...eventBase(deps, run, at),
          documentRef: input.documentRef,
          ...(input.operationId ? { operationId: input.operationId } : {}),
          extractionId: extraction.id,
          candidateCount: extraction.candidates.length,
          needsAttentionCount,
          injectionSuspected: extraction.injectionSuspected,
        },
      ],
    );
    lostClaim(applied);
    logger.log("info", options.reused ? "ai.run.reused" : "ai.run.succeeded", {
      runId: run.id,
      task: "EXTRACT",
      attempts: options.attempts,
      latencyMs: elapsed(),
      costUsd: options.costUsd,
      injectionSuspected: extraction.injectionSuspected,
    });
  };

  const document = await deps.documents.get(input.documentRef);
  if (!document) {
    await fail(new AiEngineError("AI_NOT_FOUND", "El documento ya no existe en el almacenamiento"), 0);
    return;
  }

  let preflight;
  try {
    preflight = await preflightDocument(document.bytes, config.extraction);
  } catch (error) {
    await fail(toAiEngineError(error), 0);
    return;
  }

  const resolved = resolveDocumentSchema(input.documentType);
  const pipelineFingerprint = extractionPipelineFingerprint(resolved, config.extraction.imageMinSize, deps.hasher);
  const fileSha256 = deps.hasher.sha256Hex(document.bytes);
  const existing = await deps.extractions.findByKey({
    fileSha256,
    ocrModel: deps.ocr.modelId,
    pipelineFingerprint,
    isLab: input.lab,
  });
  if (existing) {
    await succeed(existing, { reused: true, attempts: 0, costUsd: 0 });
    return;
  }

  const annotationSchema = resolved.schema ? toAnnotationSchema(resolved.schema) : undefined;
  const annotated = !!annotationSchema || resolved.classifyImages;
  let ocrResult;
  try {
    ocrResult = await withRetries(
      () =>
        deps.ocr.extract({
          bytes: document.bytes,
          mimeType: preflight.mimeType,
          fileName: document.fileName,
          ...(annotationSchema ? { annotationSchema } : {}),
          ...(resolved.classifyImages ? { imageClassificationSchema: IMAGE_CLASSIFICATION_SCHEMA } : {}),
          imageMinSize: config.extraction.imageMinSize,
        }),
      { maxAttempts: config.extraction.maxAttempts, backoffMs: config.extraction.backoffMs },
      deps.delay,
    );
  } catch (error) {
    if (error instanceof RetriesExhaustedError) {
      await fail(error.last, error.attempts);
      return;
    }
    throw error;
  }

  const extraction = buildExtraction({
    id: deps.ids.newId(),
    fileSha256,
    documentType: input.documentType,
    schemaCode: resolved.code,
    schemaVersion: resolved.version,
    pipelineFingerprint,
    schema: resolved.schema,
    ocr: ocrResult.value,
    confidenceThreshold: config.extraction.confidenceThreshold,
    injectionPatterns: compileInjectionPatterns(config.safety.injectionPatterns),
    createdAt: deps.clock.now().toISOString(),
    isLab: input.lab,
  });
  // La clave de deduplicación usa el modelo fijado en configuración; el que reporta el
  // proveedor queda en la ejecución (modelId) y en la respuesta cruda.
  const saved = await deps.extractions.save(
    { ...extraction, ocrModel: deps.ocr.modelId },
    {
      model: ocrResult.value.model,
      pagesProcessed: ocrResult.value.usage.pagesProcessed,
      annotation: ocrResult.value.annotation ?? null,
    },
  );
  const pricePerPage = annotated ? config.prices.ocrAnnotatedUsdPerPage : config.prices.ocrUsdPerPage;
  await succeed(saved, {
    reused: false,
    attempts: ocrResult.attempts,
    costUsd: ocrResult.value.usage.pagesProcessed * pricePerPage,
    providerModel: ocrResult.value.model,
  });
}
