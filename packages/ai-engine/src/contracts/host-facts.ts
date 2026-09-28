import { z } from "zod";
import { DocumentTypeSchema } from "./common";

/**
 * Hechos que el anfitrión (fases 1–3) publica. El motor los escucha y decide qué
 * comando ejecutar; el anfitrión nunca llama al proveedor de IA ni espera su respuesta.
 */

export const DocumentUploadedSchema = z.object({
  type: z.literal("DocumentUploaded"),
  documentAssetId: z.string().min(1),
  operationId: z.string().min(1),
  checklistCode: z.string().min(1),
  documentType: DocumentTypeSchema,
  uploadedBy: z.string().min(1),
  occurredAt: z.string().datetime(),
});
export type DocumentUploaded = z.infer<typeof DocumentUploadedSchema>;

export const OperationSubmittedForReviewSchema = z.object({
  type: z.literal("OperationSubmittedForReview"),
  operationId: z.string().min(1),
  submittedBy: z.string().min(1),
  occurredAt: z.string().datetime(),
});
export type OperationSubmittedForReview = z.infer<typeof OperationSubmittedForReviewSchema>;

export const CaseSnapshotChangedSchema = z.object({
  type: z.literal("CaseSnapshotChanged"),
  operationId: z.string().min(1),
  occurredAt: z.string().datetime(),
});
export type CaseSnapshotChanged = z.infer<typeof CaseSnapshotChangedSchema>;

export const HostFactSchema = z.discriminatedUnion("type", [
  DocumentUploadedSchema,
  OperationSubmittedForReviewSchema,
  CaseSnapshotChangedSchema,
]);
export type HostFact = z.infer<typeof HostFactSchema>;
