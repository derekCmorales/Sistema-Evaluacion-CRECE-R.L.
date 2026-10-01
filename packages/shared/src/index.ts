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

export type AiAlertType =
  | "BUREAU_MISMATCH"
  | "INCOHERENCE"
  | "INJECTION_SUSPECTED"
  | "MISSING_EVIDENCE"
  | "OTHER";

export const AI_ALERT_TYPES: readonly AiAlertType[] = [
  "BUREAU_MISMATCH",
  "INCOHERENCE",
  "INJECTION_SUSPECTED",
  "MISSING_EVIDENCE",
  "OTHER",
];

/** De dónde sale lo que una alerta de IA afirma. */
export type EvidenceSourceType = "DOCUMENT" | "POLICY" | "CALC";

export const EVIDENCE_SOURCE_TYPES: readonly EvidenceSourceType[] = [
  "DOCUMENT",
  "POLICY",
  "CALC",
];

/**
 * Evidencia citada por una alerta. `sourceId` es el id del documento, del chunk de
 * política o el nombre del campo de cálculo; `quote` es el texto citado tal cual.
 */
export type AiEvidence = {
  sourceType: EvidenceSourceType;
  sourceId: string;
  quote: string;
  page?: number;
};

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
  INJECTION_SUSPECTED: "Posible manipulación del documento",
  MISSING_EVIDENCE: "Falta evidencia",
  OTHER: "Otro",
};

export const EVIDENCE_SOURCE_TYPE_LABELS: Record<EvidenceSourceType, string> = {
  DOCUMENT: "Documento del expediente",
  POLICY: "Política de CRECE",
  CALC: "Cálculo",
};

export const AI_ALERT_RESOLUTION_LABELS: Record<AiAlertResolutionStatus, string> = {
  CONFIRMED: "Confirmada",
  DISMISSED: "Descartada",
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

/* -------------------------------------------------------------------------
 * Captación: fases 1–3 (registro, apertura en borrador, armado del expediente)
 * ------------------------------------------------------------------------- */

export const API_PERSONS_PATH = "/persons" as const;
export const API_OPERATIONS_PATH = "/operations" as const;

/** Identidad del usuario que actúa. Llega del `AuthGateway`; hoy, de la sesión de desarrollo. */
export type Actor = {
  userId: UserId;
  offices: Office[];
};

export const PERSON_SOURCE_LABELS: Record<PersonSource, string> = {
  LANDING: "Landing",
  ADVISOR: "Agencia",
};

export const WATCHLIST_SOURCE_LABELS: Record<WatchlistSource, string> = {
  OFAC: "OFAC",
  ONU: "ONU",
  GUATECOMPRAS: "Guatecompras",
};

export const WATCHLIST_RESULT_LABELS: Record<WatchlistResult, string> = {
  CLEAR: "Sin coincidencias",
  MATCH_FOUND: "Coincidencia encontrada",
  PENDING_MANUAL_REVIEW: "En revisión manual",
};

/**
 * Semilla de configuración — el valor vivo vive en `caseAssembly.watchlistSources` (DB).
 * Listas de control que todo expediente consulta antes de pasar a revisión.
 */
export const WATCHLIST_SOURCES_SEED: WatchlistSource[] = ["OFAC", "ONU", "GUATECOMPRAS"];

export const CASE_ASSEMBLY_CONFIG_KEYS = {
  watchlistSources: "caseAssembly.watchlistSources",
} as const;

/** Qué le falta a un expediente para quedar armado. */
export type CaseAssemblyGap =
  | "CHECKLIST_PENDING"
  | "ASSESSMENT_MISSING"
  | "GUARANTOR_INCOMPLETE"
  | "WATCHLIST_MISSING"
  | "WATCHLIST_PENDING_REVIEW"
  | "WATCHLIST_MATCH";

export const CASE_ASSEMBLY_GAP_LABELS: Record<CaseAssemblyGap, string> = {
  CHECKLIST_PENDING: "Requisitos obligatorios pendientes",
  ASSESSMENT_MISSING: "Falta la evaluación financiera",
  GUARANTOR_INCOMPLETE: "Faltan datos o evaluación del fiador",
  WATCHLIST_MISSING: "Falta consultar listas de control",
  WATCHLIST_PENDING_REVIEW: "Consulta en revisión manual",
  WATCHLIST_MATCH: "Coincidencia en listas: analizar antes de seguir",
};

/** Fila del directorio de solicitantes. El DPI viaja enmascarado (minimización de PII). */
export type PersonListItem = {
  id: PersonId;
  fullName: string;
  dpiMasked?: string;
  phone: string;
  status: PersonStatus;
  source?: PersonSource;
  interest?: ProspectInterest;
  createdAt: string;
  operationsCount: number;
};

/** Fila del historial de solicitudes de una persona. */
export type OperationListItem = {
  id: OperationId;
  personId: PersonId;
  productType: ProductType;
  guaranteeType: GuaranteeType;
  requestedAmount: Money;
  termMonths: number;
  purpose: string;
  state: OperationState;
  hasGuarantor: boolean;
  createdAt: string;
  updatedAt: string;
};

/** Acciones de captación que quedan en la bitácora (append-only). */
export type CaptureAuditAction =
  | "PROSPECT_CREATED"
  | "PERSON_REGISTERED"
  | "PERSON_DPI_ASSIGNED"
  | "OPERATION_OPENED"
  | "CHECKLIST_ITEM_UPDATED"
  | "ASSESSMENT_RECORDED"
  | "GUARANTOR_SET"
  | "WATCHLIST_CHECKED"
  | "CASE_ASSEMBLED"
  // Sprint 2 · fases 4 a 7 (contrato del PR 0)
  | "HARD_RULE_EXCEPTION_JUSTIFIED"
  | "OPINION_SAVED"
  | "OPERATION_READY_FOR_REVIEW"
  | "OPERATION_REOPENED"
  | "OPERATION_SUBMITTED"
  | "AI_ALERT_RESOLVED"
  | "AI_REVIEW_RETRIED";

export const CAPTURE_AUDIT_ACTION_LABELS: Record<CaptureAuditAction, string> = {
  PROSPECT_CREATED: "Prospecto recibido desde la landing",
  PERSON_REGISTERED: "Solicitante registrado en agencia",
  PERSON_DPI_ASSIGNED: "DPI completado",
  OPERATION_OPENED: "Solicitud abierta en borrador",
  CHECKLIST_ITEM_UPDATED: "Requisito actualizado",
  ASSESSMENT_RECORDED: "Evaluación financiera capturada",
  GUARANTOR_SET: "Fiador registrado",
  WATCHLIST_CHECKED: "Consulta a lista de control",
  CASE_ASSEMBLED: "Expediente marcado como armado",
  HARD_RULE_EXCEPTION_JUSTIFIED: "Excepción a una regla justificada",
  OPINION_SAVED: "Dictamen 5C guardado",
  OPERATION_READY_FOR_REVIEW: "Solicitud marcada lista para revisión",
  OPERATION_REOPENED: "Captura reabierta",
  OPERATION_SUBMITTED: "Solicitud enviada a revisión",
  AI_ALERT_RESOLVED: "Alerta de IA resuelta",
  AI_REVIEW_RETRIED: "Análisis de IA reintentado",
};

/**
 * Llave de configuración del largo mínimo de toda justificación escrita por una persona
 * (excepción a regla, devolución, descarte de alerta). El valor vivo sale de `ConfigRepository`.
 */
export const JUSTIFICATION_MIN_LENGTH_KEY = "justification.minLength";

/** Semilla del largo mínimo de una justificación. No usar fuera de seeds / fallbacks. */
export const JUSTIFICATION_MIN_LENGTH_SEED = 20;

/**
 * Hecho que publica `submitForReview` (fase 5). Lo consume el motor de IA (fase 6) con la
 * misma forma que su `OperationSubmittedForReviewSchema`; el envío nunca depende de que
 * alguien lo procese.
 */
export type OperationSubmittedForReview = {
  type: "OperationSubmittedForReview";
  operationId: OperationId;
  submittedBy: UserId;
  occurredAt: string;
};

/** Fila de la bandeja por firmar (D-04): solo lo que a los cargos del usuario les falta. */
export type AuthorizationInboxItem = {
  operationId: OperationId;
  personName: string;
  purpose: string;
  amount: Money;
  route: AuthorizationRoute;
  /** Cargo con el que este usuario firmaría o votaría. */
  officeToExercise: Office;
  /** Firmas o votos que aún faltan para cerrar la ruta. */
  missingOffices: Office[];
  votesCast: number;
  votesRequired: number;
  submittedForReviewAt: string;
  waitingDays: number;
  unresolvedAiAlerts: number;
};

/** Un voto del acta: la persona, el cargo ejercido y lo que decidió. */
export type MinutesVote = {
  byUserId: UserId;
  byName: string;
  officeCode: Office;
  decision: VerdictDecision;
  factorCodes: string[];
  reason?: string;
  modifiedAmount?: Money;
  modifiedTermMonths?: number;
  at: string;
};

/** Acta de autorización (D-07), armada desde los veredictos. El PDF es de la fase 8. */
export type MinutesView = {
  operationId: OperationId;
  route: AuthorizationRoute;
  personName: string;
  purpose: string;
  requestedAmount: Money;
  termMonths: number;
  preparedBy: UserId;
  submittedForReviewAt: string;
  votes: MinutesVote[];
  finalState: OperationState;
  approvedAmount?: Money;
  approvedTermMonths?: number;
  generatedAt: string;
};

/** Autor de lo que entra por la landing: no hay usuario interno detrás. */
export const LANDING_ACTOR_ID: UserId = toUserId("system:landing");

/** Fila de la cola de expedientes, con su avance de armado. */
export type CaseFileListItem = OperationListItem & {
  personName: string;
  readyForReview: boolean;
  gapsCount: number;
};

export class NotFoundError extends DomainError {
  constructor(message: string) {
    super(message, "NOT_FOUND");
  }
}

export class UnauthenticatedError extends DomainError {
  constructor(message = "Inicia sesión para continuar") {
    super(message, "UNAUTHENTICATED");
  }
}

/** El DPI ya pertenece a otra persona: se reutiliza su perfil, no se duplica. */
export class DuplicatePersonError extends DomainError {
  constructor(readonly existingPersonId: PersonId) {
    super(
      "Ya existe una persona con ese DPI. Abre la solicitud desde su perfil en lugar de registrarla de nuevo.",
      "DUPLICATE_PERSON",
    );
  }
}
