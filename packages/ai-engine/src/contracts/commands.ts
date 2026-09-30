import { z } from "zod";
import { DocumentTypeSchema, RequesterSchema } from "./common";

const IdempotencyKey = z.string().min(1).max(200);

/** Extraer un documento del expediente (o del lab). */
export const ExtractDocumentCommandSchema = z.object({
  documentRef: z.string().min(1),
  documentType: DocumentTypeSchema,
  operationId: z.string().min(1).optional(),
  requestedBy: RequesterSchema,
  idempotencyKey: IdempotencyKey.optional(),
  lab: z.boolean().default(false),
});
export type ExtractDocumentCommand = z.input<typeof ExtractDocumentCommandSchema>;

/**
 * Reintentar una ejecución fallida: crea una ejecución nueva con la misma entrada (la fallida
 * queda como historial). Repetir el comando mientras la nueva sigue viva devuelve la misma.
 */
export const RetryRunCommandSchema = z.object({
  runId: z.string().min(1),
  requestedBy: RequesterSchema,
});
export type RetryRunCommand = z.input<typeof RetryRunCommandSchema>;

/** Ingestar (nueva versión de) una fuente de política. Solo SYSTEM_ADMIN. */
export const IngestKnowledgeSourceCommandSchema = z.object({
  documentRef: z.string().min(1),
  sourceCode: z.string().regex(/^[a-z0-9-]+$/, "kebab-case"),
  title: z.string().min(1),
  effectiveFrom: z.string().date(),
  requestedBy: RequesterSchema,
  idempotencyKey: IdempotencyKey.optional(),
  lab: z.boolean().default(false),
});
export type IngestKnowledgeSourceCommand = z.input<typeof IngestKnowledgeSourceCommandSchema>;

/** Hechos estructurados de un caso para armar la consulta de recuperación. */
export const CaseFactsSchema = z.object({
  productType: z.string().min(1),
  guaranteeType: z.string().min(1),
  purpose: z.string(),
  hasGuarantor: z.boolean(),
  hardRuleCodes: z.array(z.string()),
});
export type CaseFacts = z.infer<typeof CaseFactsSchema>;

export const SearchParamsSchema = z.object({
  limit: z.number().int().min(1).max(50).optional(),
  candidateDepth: z.number().int().min(1).max(200).optional(),
  semanticWeight: z.number().min(0).max(10).optional(),
  lexicalWeight: z.number().min(0).max(10).optional(),
  efSearch: z.number().int().min(10).max(1000).optional(),
  includeQueryPlan: z.boolean().optional(),
});
export type SearchParams = z.infer<typeof SearchParamsSchema>;

/** Búsqueda síncrona: texto libre (lab) o hechos de un caso. Exactamente uno. */
export const SearchKnowledgeCommandSchema = z
  .object({
    query: z.string().min(1).optional(),
    caseFacts: CaseFactsSchema.optional(),
    params: SearchParamsSchema.optional(),
    requestedBy: RequesterSchema,
    includeDrafts: z.boolean().default(false),
  })
  .refine((c) => (c.query ? !c.caseFacts : !!c.caseFacts), {
    message: "Indique query o caseFacts, no ambos",
  });
export type SearchKnowledgeCommand = z.input<typeof SearchKnowledgeCommandSchema>;

export const RequestDraft5CCommandSchema = z.object({
  operationId: z.string().min(1),
  requestedBy: RequesterSchema,
  force: z.boolean().default(false),
  idempotencyKey: IdempotencyKey.optional(),
  lab: z.boolean().default(false),
});
export type RequestDraft5CCommand = z.input<typeof RequestDraft5CCommandSchema>;

export const RunReviewAnalysisCommandSchema = z.object({
  operationId: z.string().min(1),
  requestedBy: RequesterSchema.optional(),
  force: z.boolean().default(false),
  idempotencyKey: IdempotencyKey.optional(),
  lab: z.boolean().default(false),
});
export type RunReviewAnalysisCommand = z.input<typeof RunReviewAnalysisCommandSchema>;
