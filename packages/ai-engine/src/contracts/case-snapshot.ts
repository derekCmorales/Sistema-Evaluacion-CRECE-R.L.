import { z } from "zod";
import { DocumentTypeSchema } from "./common";

const Decimal = z.string().regex(/^-?\d+(\.\d+)?$/, "Decimal serializado (sin separadores)");

const PartySchema = z.object({
  displayName: z.string().min(1),
  dpi: z.string().optional(),
  nit: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
});

/**
 * Lo único que el motor sabe de un caso. Lo arma el anfitrión (operaciones) con solo
 * estos campos. Los datos de persona sirven para seudonimizar: nunca salen hacia un LLM.
 * No incluye umbral, ruta de autorización, cargos ni votos (spec ai-generation).
 */
export const CaseSnapshotSchema = z
  .object({
    operationId: z.string().min(1),
    snapshotAt: z.string().datetime(),
    product: z.object({
      productType: z.string().min(1),
      guaranteeType: z.string().min(1),
      hasGuarantor: z.boolean(),
      purpose: z.string(),
      requestedAmountGTQ: Decimal,
      termMonths: z.number().int().positive(),
      annualRatePercent: z.number().nonnegative().optional(),
    }),
    applicant: PartySchema,
    guarantor: PartySchema.extend({ relationship: z.string().optional() }).optional(),
    assessment: z
      .object({
        monthlySales: z.number(),
        monthlyIncome: z.number(),
        monthlyExpenses: z.number(),
        existingDebtPayment: z.number(),
        guaranteeValue: z.number().optional(),
        projectedRoiPercent: z.number().optional(),
      })
      .optional(),
    /** Métricas del motor determinístico, ya calculadas (nombre → valor). */
    calcResult: z.record(z.string(), z.union([z.string(), z.number(), z.null()])).optional(),
    hardRuleHits: z.array(
      z.object({
        ruleCode: z.string().min(1),
        severity: z.enum(["ALERT", "BLOCK"]),
        message: z.string(),
        exceptionReason: z.string().optional(),
      }),
    ),
    /** Solo valores OCR confirmados o corregidos por una persona. */
    confirmedFields: z.array(
      z.object({
        documentId: z.string().min(1),
        fieldKey: z.string().min(1),
        fieldLabel: z.string().min(1),
        value: z.string(),
        page: z.number().int().positive().optional(),
      }),
    ),
    documents: z.array(
      z.object({
        documentId: z.string().min(1),
        documentType: DocumentTypeSchema,
        checklistCode: z.string().min(1),
        /** Extracción del motor que corresponde a este documento, si existe. */
        extractionId: z.string().optional(),
      }),
    ),
  })
  .strict();

export type CaseSnapshot = z.infer<typeof CaseSnapshotSchema>;
