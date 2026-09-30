import { z } from "zod";
import { AI_ERROR_CODES } from "./errors";
import { AiTaskSchema } from "./common";

/**
 * Eventos que el motor publica (vía outbox). Solo referencias: el detalle se consulta.
 * La entrega es "al menos una vez": el consumidor deduplica por `eventId`.
 */

/** Versión del formato de eventos; cambia solo con un cambio incompatible. */
export const AI_EVENT_SCHEMA_VERSION = 1;

const Base = {
  eventId: z.string().min(1),
  schemaVersion: z.literal(AI_EVENT_SCHEMA_VERSION),
  runId: z.string().min(1),
  occurredAt: z.string().datetime(),
  lab: z.boolean(),
};

export const DocumentExtractionCompletedSchema = z.object({
  type: z.literal("DocumentExtractionCompleted"),
  ...Base,
  documentRef: z.string().min(1),
  operationId: z.string().optional(),
  extractionId: z.string().min(1),
  candidateCount: z.number().int().nonnegative(),
  needsAttentionCount: z.number().int().nonnegative(),
  /** Algún texto del documento parece dirigido a una IA: la UI lo muestra para revisión humana. */
  injectionSuspected: z.boolean(),
});

export const KnowledgeSourceIndexedSchema = z.object({
  type: z.literal("KnowledgeSourceIndexed"),
  ...Base,
  sourceId: z.string().min(1),
  sourceCode: z.string().min(1),
  version: z.number().int().positive(),
  chunkCount: z.number().int().nonnegative(),
  reusedEmbeddings: z.number().int().nonnegative(),
});

export const Draft5CReadySchema = z.object({
  type: z.literal("Draft5CReady"),
  ...Base,
  operationId: z.string().min(1),
});

export const ReviewAnalysisCompletedSchema = z.object({
  type: z.literal("ReviewAnalysisCompleted"),
  ...Base,
  operationId: z.string().min(1),
  alertCount: z.number().int().nonnegative(),
  trimmed: z.boolean(),
});

export const AiRunFailedSchema = z.object({
  type: z.literal("AiRunFailed"),
  ...Base,
  task: AiTaskSchema,
  operationId: z.string().optional(),
  documentRef: z.string().optional(),
  errorCode: z.enum(AI_ERROR_CODES),
  retryable: z.boolean(),
});

export const AiEngineEventSchema = z.discriminatedUnion("type", [
  DocumentExtractionCompletedSchema,
  KnowledgeSourceIndexedSchema,
  Draft5CReadySchema,
  ReviewAnalysisCompletedSchema,
  AiRunFailedSchema,
]);

export type AiEngineEvent = z.infer<typeof AiEngineEventSchema>;
export type DocumentExtractionCompleted = z.infer<typeof DocumentExtractionCompletedSchema>;
export type KnowledgeSourceIndexed = z.infer<typeof KnowledgeSourceIndexedSchema>;
export type Draft5CReady = z.infer<typeof Draft5CReadySchema>;
export type ReviewAnalysisCompleted = z.infer<typeof ReviewAnalysisCompletedSchema>;
export type AiRunFailed = z.infer<typeof AiRunFailedSchema>;
