import type { AcceptedRun, DocumentType } from "../contracts/common";
import { ExtractDocumentCommandSchema, type ExtractDocumentCommand } from "../contracts/commands";
import { AiEngineError } from "../contracts/errors";
import type { AiEngineEvent } from "../contracts/events";
import type { DocumentExtraction } from "../contracts/ocr";
import type { AiEngineConfig } from "../config/engine-config";
import { IMAGE_CLASSIFICATION_SCHEMA, resolveDocumentSchema, toAnnotationSchema } from "../extraction/document-schemas";
import { buildExtraction } from "../extraction/ocr-normalizer";
import { preflightDocument } from "../extraction/preflight";
import type {
  AiRun,
  Clock,
  Delay,
  DocumentSource,
  ExtractionStore,
  Hasher,
  IdGenerator,
  JobQueue,
  OcrProvider,
  RunStore,
} from "../ports";
import { parseCommand } from "./parse-command";
import { assertAnyOffice, OPERATING_OFFICES } from "./permissions";
import { RetriesExhaustedError, toAiEngineError, withRetries } from "./retry";

export type ExtractionDeps = {
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
};

/** Lo que se guarda en `ai_run.input`: parámetros, nunca el contenido del documento. */
type ExtractionInput = {
  documentRef: string;
  documentType: DocumentType;
  operationId?: string;
  lab: boolean;
};

export async function acceptExtraction(deps: ExtractionDeps, raw: ExtractDocumentCommand): Promise<AcceptedRun> {
  const command = parseCommand(ExtractDocumentCommandSchema, raw);
  assertAnyOffice(command.requestedBy, OPERATING_OFFICES, "extraer documentos");

  const input: ExtractionInput = {
    documentRef: command.documentRef,
    documentType: command.documentType,
    ...(command.operationId ? { operationId: command.operationId } : {}),
    lab: command.lab,
  };
  const { run, created } = await deps.runs.createOrGet({
    id: deps.ids.newId(),
    task: "EXTRACT",
    idempotencyKey: command.idempotencyKey ?? `extract:${command.documentRef}`,
    ...(command.operationId ? { operationId: command.operationId } : {}),
    documentRef: command.documentRef,
    requestedBy: command.requestedBy.userId,
    forced: false,
    isLab: command.lab,
    input,
    createdAt: deps.clock.now().toISOString(),
  });
  if (created) await deps.jobs.enqueue({ task: "EXTRACT", runId: run.id });
  return { runId: run.id, status: run.status, reused: !created };
}

export async function executeExtraction(deps: ExtractionDeps, run: AiRun): Promise<void> {
  const input = run.input as ExtractionInput;
  const started = deps.clock.now();
  const elapsed = () => deps.clock.now().getTime() - started.getTime();
  const base = { runId: run.id, lab: run.isLab };

  const fail = async (error: AiEngineError, attempts: number) => {
    const at = deps.clock.now().toISOString();
    const event: AiEngineEvent = {
      type: "AiRunFailed",
      ...base,
      occurredAt: at,
      task: "EXTRACT",
      documentRef: input.documentRef,
      ...(input.operationId ? { operationId: input.operationId } : {}),
      errorCode: error.aiCode,
      retryable: error.retryable,
    };
    await deps.runs.markFailed(
      run.id,
      { errorCode: error.aiCode, errorMessage: error.message, attempts, latencyMs: elapsed() },
      at,
      [event],
    );
  };

  const succeed = async (
    extraction: DocumentExtraction,
    reused: boolean,
    attempts: number,
    pages: number,
    providerModel?: string,
  ) => {
    await deps.extractions.linkDocument(input.documentRef, extraction.id, input.operationId);
    const at = deps.clock.now().toISOString();
    const needsAttentionCount = extraction.candidates.filter((c) => c.needsAttention).length;
    await deps.runs.markSucceeded(
      run.id,
      {
        status: reused ? "REUSED" : "SUCCEEDED",
        modelId: providerModel ?? extraction.ocrModel,
        attempts,
        latencyMs: elapsed(),
        costEstimateUsd: reused ? 0 : pages * deps.config.prices.ocrUsdPerPage,
        output: {
          extractionId: extraction.id,
          pages: extraction.pages.length,
          candidateCount: extraction.candidates.length,
          needsAttentionCount,
          reused,
        },
      },
      at,
      [
        {
          type: "DocumentExtractionCompleted",
          ...base,
          occurredAt: at,
          documentRef: input.documentRef,
          ...(input.operationId ? { operationId: input.operationId } : {}),
          extractionId: extraction.id,
          candidateCount: extraction.candidates.length,
          needsAttentionCount,
        },
      ],
    );
  };

  const document = await deps.documents.get(input.documentRef);
  if (!document) {
    await fail(new AiEngineError("AI_NOT_FOUND", "El documento ya no existe en el almacenamiento"), 0);
    return;
  }

  let preflight;
  try {
    preflight = preflightDocument(document.bytes, deps.config.extraction);
  } catch (error) {
    await fail(toAiEngineError(error), 0);
    return;
  }

  const resolved = resolveDocumentSchema(input.documentType);
  const fileSha256 = deps.hasher.sha256Hex(document.bytes);
  const existing = await deps.extractions.findByKey({
    fileSha256,
    ocrModel: deps.ocr.modelId,
    schemaCode: resolved.code,
    schemaVersion: resolved.version,
  });
  if (existing) {
    await succeed(existing, true, 0, 0);
    return;
  }

  const annotationSchema = resolved.schema ? toAnnotationSchema(resolved.schema) : undefined;
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
          imageMinSize: deps.config.extraction.imageMinSize,
          ...(preflight.pagesToProcess ? { pages: preflight.pagesToProcess } : {}),
        }),
      { maxAttempts: deps.config.extraction.maxAttempts, backoffMs: deps.config.extraction.backoffMs },
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
    schema: resolved.schema,
    ocr: ocrResult.value,
    confidenceThreshold: deps.config.extraction.confidenceThreshold,
    createdAt: deps.clock.now().toISOString(),
    isLab: input.lab,
  });
  // La clave de deduplicación usa el modelo configurado; el modelo real que reporta el
  // proveedor queda en la ejecución (modelId) y en la respuesta cruda.
  const saved = await deps.extractions.save(
    { ...extraction, ocrModel: deps.ocr.modelId },
    {
      model: ocrResult.value.model,
      pagesProcessed: ocrResult.value.usage.pagesProcessed,
      annotation: ocrResult.value.annotation ?? null,
    },
  );
  await succeed(saved, false, ocrResult.attempts, ocrResult.value.usage.pagesProcessed, ocrResult.value.model);
}

