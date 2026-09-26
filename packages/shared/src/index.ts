export type Brand<T, B extends string> = T & { readonly __brand: B };

export type PersonId = Brand<string, "PersonId">;
export type OperationId = Brand<string, "OperationId">;
export type UserId = Brand<string, "UserId">;
export type DocumentId = Brand<string, "DocumentId">;

export const toPersonId = (id: string): PersonId => id as PersonId;
export const toOperationId = (id: string): OperationId => id as OperationId;
export const toUserId = (id: string): UserId => id as UserId;
export const toDocumentId = (id: string): DocumentId => id as DocumentId;

export type Currency = "GTQ";

/** Dinero en quetzales. `amount` es decimal serializado (nunca float de negocio). */
export type Money = {
  amount: string;
  currency: Currency;
};

/** Alias de contrato compartido (web/api). */
export type MoneyGTQ = Money;

export const money = (amount: number | string, currency: Currency = "GTQ"): Money => ({
  amount: typeof amount === "number" ? amount.toFixed(2) : amount,
  currency,
});

export type PersonStatus = "PROSPECT" | "ACTIVE" | "INACTIVE";

export type ProductType = "WORKING_CAPITAL" | "INVESTMENT" | "MICROCREDIT";

export type GuaranteeType = "MORTGAGE" | "PLEDGE" | "PERSONAL" | "MIXED";

export type OperationState =
  | "DRAFT"
  | "READY_FOR_REVIEW"
  | "UNDER_REVIEW"
  | "RETURNED_TO_ADVISOR"
  | "APPROVED"
  | "REJECTED"
  | "PACKAGED";

export type ChecklistItemStatus =
  | "PENDING"
  | "UPLOADED"
  | "CONFIRMED"
  | "NOT_APPLICABLE"
  | "MISSING_VISIBLE";

export type DocumentValidityStatus = "VALID" | "EXPIRING" | "EXPIRED";

export type HardRuleSeverity = "ALERT" | "BLOCK";

export const VerdictDecision = {
  APPROVE: "APPROVE",
  APPROVE_WITH_CHANGES: "APPROVE_WITH_CHANGES",
  REJECT: "REJECT",
  RETURN: "RETURN",
} as const;

export type VerdictDecision =
  (typeof VerdictDecision)[keyof typeof VerdictDecision];

/** @deprecated Usar `VerdictDecision`. Alias del bootstrap inicial. */
export const ApprovalOutcome = VerdictDecision;
export type ApprovalOutcome = VerdictDecision;

export type AiAlertResolutionStatus = "CONFIRMED" | "DISMISSED";

export type SavingsOperationType = "SAVINGS" | "CONTRIBUTION" | "FIXED_TERM";

export type GeneratedDocumentType =
  | "APPLICATION_SUMMARY"
  | "AMORTIZATION"
  | "IVE"
  | "CONTRACT"
  | "FIXED_TERM_CERT";

/** Cargo del organigrama. Un usuario tiene 1..n; los permisos se suman. No existe Gerencia. */
export type Office =
  | "ADVISOR"
  | "BRANCH_HEAD"
  | "ADMIN_ASSISTANT"
  | "DELEGATED_AUTHORIZER"
  | "COUNCIL_MEMBER"
  | "OVERSIGHT"
  | "SYSTEM_ADMIN";

export type AuthorizationBandKind = "SIGNATURES" | "QUORUM";

export type AuthorizationSlot = {
  officeCode: Office;
  minCount: number;
};

export type AuthorizationBand = {
  kind: AuthorizationBandKind;
  maxAmountExclusive?: number;
  minAmountInclusive?: number;
  slots?: AuthorizationSlot[];
  quorumOffice?: Office;
  quorumN?: number;
};

export type AuthorizationPolicy = {
  thresholdGTQ: number;
  bands: AuthorizationBand[];
};

export type AuthorizationRoute = "BRANCH_DUAL_SIGNATURE" | "COUNCIL_QUORUM";

export type NotificationType =
  | "ASSIGNMENT"
  | "VOTE_PENDING"
  | "OCR_CONFIRMED"
  | "RETURNED"
  | "VOTE_REMINDER"
  | "DOC_EXPIRING"
  | "WAITING_REMINDER"
  | "GENERAL";

export type Opinion5C = {
  character: string;
  capacity: string;
  capital: string;
  conditions: string;
  collateral: string;
};

export type ProspectInterest = "CREDIT" | "SAVINGS" | "FIXED_TERM";

export type ProspectSource = "LANDING" | "ADVISOR";
export type PersonSource = ProspectSource;

export type WatchlistSource = "OFAC" | "ONU" | "GUATECOMPRAS";
export type WatchlistResult = "CLEAR" | "MATCH_FOUND" | "PENDING_MANUAL_REVIEW";

export type AiAlertType = "BUREAU_MISMATCH" | "INCOHERENCE" | "OTHER";

export type OcrCandidateStatus = "PENDING" | "CONFIRMED" | "CORRECTED" | "DISCARDED";

/**
 * Semilla de configuración — el valor vivo vive en `authorization.policy` (DB).
 * No usar este número en reglas de negocio fuera de seeds / fallbacks.
 */
export const COUNCIL_THRESHOLD_GTQ_SEED = 100_000;

/** Semilla: hoy el Consejo opera 3 de 3 titulares. */
export const DEFAULT_COUNCIL_QUORUM_N_SEED = 3;

export const ALL_OFFICES: Office[] = [
  "ADVISOR",
  "BRANCH_HEAD",
  "ADMIN_ASSISTANT",
  "DELEGATED_AUTHORIZER",
  "COUNCIL_MEMBER",
  "OVERSIGHT",
  "SYSTEM_ADMIN",
];

export function authorizationPolicyFromThreshold(
  thresholdGTQ: number,
  quorumN: number = DEFAULT_COUNCIL_QUORUM_N_SEED,
): AuthorizationPolicy {
  return {
    thresholdGTQ,
    bands: [
      {
        kind: "SIGNATURES",
        maxAmountExclusive: thresholdGTQ,
        slots: [
          { officeCode: "BRANCH_HEAD", minCount: 1 },
          { officeCode: "DELEGATED_AUTHORIZER", minCount: 1 },
        ],
      },
      {
        kind: "QUORUM",
        minAmountInclusive: thresholdGTQ,
        quorumOffice: "COUNCIL_MEMBER",
        quorumN,
      },
    ],
  };
}

export const DEFAULT_AUTHORIZATION_POLICY = authorizationPolicyFromThreshold(
  COUNCIL_THRESHOLD_GTQ_SEED,
  DEFAULT_COUNCIL_QUORUM_N_SEED,
);

export const DEFAULT_SEMAPHORE_CONFIG = {
  waitingDaysRed: 7,
  checklistIncompletePercent: 50,
  docExpiryWarningDays: 30,
  waitingReminderDays: 5,
};

export const DEFAULT_RATES_CONFIG = {
  creditAnnualRatePercent: 18,
  fixedTermRates: { minMonths: 6, maxMonths: 36, annualRatePercent: 8 },
  maxInstallmentToIncomeRatio: 0.25,
  accountOpeningFeeGTQ: 200,
  membershipFeeGTQ: 25,
  provisional: true,
};

export const OFFICE_LABELS: Record<Office, string> = {
  ADVISOR: "Asesor financiero",
  BRANCH_HEAD: "Jefatura de Agencia",
  ADMIN_ASSISTANT: "Asistente administrativa",
  DELEGATED_AUTHORIZER: "Autorizador delegado",
  COUNCIL_MEMBER: "Miembro del Consejo",
  OVERSIGHT: "Comisión de Vigilancia",
  SYSTEM_ADMIN: "Administrador del sistema",
};

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  ASSIGNMENT: "Asignación",
  VOTE_PENDING: "Voto pendiente",
  OCR_CONFIRMED: "Confirmación",
  RETURNED: "Devolución",
  VOTE_REMINDER: "Recordatorio de voto",
  DOC_EXPIRING: "Documento por vencer",
  WAITING_REMINDER: "Caso en espera",
  GENERAL: "General",
};

export const OPERATION_STATE_LABELS: Record<OperationState, string> = {
  DRAFT: "Borrador",
  READY_FOR_REVIEW: "Listo para revisión",
  UNDER_REVIEW: "En revisión",
  RETURNED_TO_ADVISOR: "Devuelto al asesor",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
  PACKAGED: "Empaquetado",
};

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  WORKING_CAPITAL: "MIPYME / capital de trabajo",
  INVESTMENT: "Inversión / vivienda productiva",
  MICROCREDIT: "Consumo / microcrédito",
};

export const GUARANTEE_TYPE_LABELS: Record<GuaranteeType, string> = {
  MORTGAGE: "Hipoteca",
  PLEDGE: "Prenda",
  PERSONAL: "Personal",
  MIXED: "Mixta",
};

export const CHECKLIST_STATUS_LABELS: Record<ChecklistItemStatus, string> = {
  PENDING: "Pendiente",
  UPLOADED: "Cargado",
  CONFIRMED: "Confirmado",
  NOT_APPLICABLE: "No aplica",
  MISSING_VISIBLE: "Faltante visible",
};

export const DOCUMENT_VALIDITY_LABELS: Record<DocumentValidityStatus, string> = {
  VALID: "Vigente",
  EXPIRING: "Por vencer",
  EXPIRED: "Vencido",
};

export const VERDICT_DECISION_LABELS: Record<VerdictDecision, string> = {
  APPROVE: "Aprobar",
  APPROVE_WITH_CHANGES: "Aprobar con cambios",
  REJECT: "Rechazar",
  RETURN: "Devolver",
};

export const SAVINGS_TYPE_LABELS: Record<SavingsOperationType, string> = {
  SAVINGS: "Ahorro",
  CONTRIBUTION: "Aportación",
  FIXED_TERM: "Plazo fijo",
};

export const OCR_CANDIDATE_STATUS_LABELS: Record<OcrCandidateStatus, string> = {
  PENDING: "Pendiente de confirmación",
  CONFIRMED: "Confirmado",
  CORRECTED: "Corregido",
  DISCARDED: "Descartado",
};

export const AI_ALERT_TYPE_LABELS: Record<AiAlertType, string> = {
  BUREAU_MISMATCH: "Discrepancia en buró",
  INCOHERENCE: "Incoherencia",
  OTHER: "Otro",
};

export const PERSON_STATUS_LABELS: Record<PersonStatus, string> = {
  PROSPECT: "Prospecto",
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
};

export const HARD_RULE_SEVERITY_LABELS: Record<HardRuleSeverity, string> = {
  ALERT: "Alerta",
  BLOCK: "Bloqueo",
};

export const PROSPECT_INTEREST_LABELS: Record<ProspectInterest, string> = {
  CREDIT: "Crédito",
  SAVINGS: "Ahorro",
  FIXED_TERM: "Plazo fijo",
};

export const API_HEALTH_PATH = "/health" as const;
export const API_PUBLIC_PROSPECTS_PATH = "/public/prospects" as const;

export * from "./format";

export class DomainError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export class InvalidTransitionError extends DomainError {
  constructor(from: string, to: string) {
    super(`Transición inválida: ${from} → ${to}`, "INVALID_TRANSITION");
  }
}

export class ForbiddenError extends DomainError {
  constructor(message: string) {
    super(message, "FORBIDDEN");
  }
}

export class InvariantViolationError extends DomainError {
  constructor(message: string) {
    super(message, "INVARIANT_VIOLATION");
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message, "VALIDATION");
  }
}

/* =========================================================================
 * CONTRATOS INICIALES: FASE 1, FASE 2 Y FASE 3 (Desarrollo Simultáneo)
 * ========================================================================= */

export const API_PERSONS_PATH = "/persons" as const;
export const API_OPERATIONS_PATH = "/operations" as const;

// -------------------------------------------------------------------------
// FASE 1: REGISTRO DEL SOLICITANTE
// -------------------------------------------------------------------------

export type CreatePersonInput = {
  fullName: string;
  dpi: string;
  phone: string;
  email?: string;
  interest: ProspectInterest;
  source: PersonSource;
  registeredByUserId?: UserId;
};

export type PersonSummaryDto = {
  id: PersonId;
  fullName: string;
  dpi: string;
  phone: string;
  email?: string;
  status: PersonStatus;
  source: PersonSource;
  interest?: ProspectInterest;
  registeredByUserId?: UserId;
  createdAt: string;
  operationsCount: number;
};

// -------------------------------------------------------------------------
// FASE 2: APERTURA DE SOLICITUD
// -------------------------------------------------------------------------

export type CreateDraftOperationInput = {
  personId: PersonId;
  productType: ProductType;
  guaranteeType: GuaranteeType;
  requestedAmount: Money;
  termMonths: number;
  purpose: string;
  hasGuarantor: boolean;
  createdBy: UserId;
};

export type ChecklistItemSummaryDto = {
  code: string;
  label: string;
  required: boolean;
  status: ChecklistItemStatus;
  notApplicableReason?: string;
  documentId?: string;
  critical?: boolean;
};

export type DraftOperationSummaryDto = {
  id: OperationId;
  personId: PersonId;
  productType: ProductType;
  guaranteeType: GuaranteeType;
  requestedAmount: Money;
  termMonths: number;
  purpose: string;
  hasGuarantor: boolean;
  state: "DRAFT";
  checklist: ChecklistItemSummaryDto[];
  createdBy: UserId;
  createdAt: string;
};

// -------------------------------------------------------------------------
// FASE 3: ARMADO DEL EXPEDIENTE
// -------------------------------------------------------------------------

export type UpdateChecklistItemInput = {
  operationId: OperationId;
  code: string;
  status: ChecklistItemStatus;
  notApplicableReason?: string;
  documentId?: DocumentId;
};

export type UpdateFinancialAssessmentInput = {
  operationId: OperationId;
  monthlySales: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  existingDebtPayment: number;
  guaranteeValue?: number;
  projectedRoiPercent?: number;
};

export type UpdateGuarantorInput = {
  operationId: OperationId;
  fullName: string;
  dpi?: string;
  phone?: string;
  relationship?: string;
  financialAssessment?: {
    monthlyIncome: number;
    monthlyExpenses: number;
    existingDebtPayment: number;
    guaranteeValue?: number;
  };
  bureauDocumentId?: DocumentId;
  notes?: string;
};

export type RecordWatchlistCheckInput = {
  operationId: OperationId;
  source: WatchlistSource;
  queryRef: string;
  result: WatchlistResult;
  notes?: string;
  checkedByUserId: UserId;
};

export type WatchlistCheckSummaryDto = {
  id: string;
  operationId: OperationId;
  source: WatchlistSource;
  queryRef: string;
  result: WatchlistResult;
  checkedByUserId: UserId;
  checkedAt: string;
  notes?: string;
};

export type CaseAssemblyStatusDto = {
  operationId: OperationId;
  assembledByUserId?: UserId;
  assembledAt?: string;
  checklistComplete: boolean;
  pendingChecklistCount: number;
  hasFinancialAssessment: boolean;
  watchlistChecksCompleted: boolean;
  readyForReview: boolean;
};
