import { z } from "zod";
import { ALL_OFFICES, type Office } from "@crece/shared";

/** Tipos de documento que el motor sabe tratar. `POLICY` es solo para la base de conocimiento. */
export const DOCUMENT_TYPES = [
  "DPI",
  "BUREAU_REPORT",
  "INCOME_RECEIPT",
  "BANK_STATEMENT",
  "UTILITY_BILL",
  "BUSINESS_PHOTO",
  "SKETCH",
  "POLICY",
  "OTHER",
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];
export const DocumentTypeSchema = z.enum(DOCUMENT_TYPES);

export const OfficeSchema = z.enum(ALL_OFFICES as [Office, ...Office[]]);

/** Quién pide algo al motor. Los permisos se evalúan con sus cargos (acumulables). */
export const RequesterSchema = z.object({
  userId: z.string().min(1),
  offices: z.array(OfficeSchema),
});
export type Requester = z.infer<typeof RequesterSchema>;

export const AI_TASKS = ["EXTRACT", "INGEST", "SEARCH", "DRAFT_5C", "REVIEW", "EVAL"] as const;
export type AiTask = (typeof AI_TASKS)[number];
export const AiTaskSchema = z.enum(AI_TASKS);

export const RUN_STATUSES = ["QUEUED", "RUNNING", "SUCCEEDED", "FAILED", "REUSED"] as const;
export type RunStatus = (typeof RUN_STATUSES)[number];

/** Uso de tokens tal como lo reporta el proveedor; `cachedInputTokens` ⊆ `inputTokens`. */
export type TokenUsage = {
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  thinkingTokens: number;
};

export const EMPTY_USAGE: TokenUsage = {
  inputTokens: 0,
  cachedInputTokens: 0,
  outputTokens: 0,
  thinkingTokens: 0,
};

/** Respuesta inmediata a un comando asíncrono. */
export type AcceptedRun = {
  runId: string;
  status: RunStatus;
  /** true si se devolvió una ejecución previa (idempotencia o reutilización). */
  reused: boolean;
};
