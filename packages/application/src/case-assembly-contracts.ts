import {
  ValidationError,
  toDocumentId,
  toOperationId,
  toUserId,
  type ChecklistItemStatus,
  type RecordWatchlistCheckInput,
  type UpdateChecklistItemInput,
  type UpdateFinancialAssessmentInput,
  type UpdateGuarantorInput,
  type WatchlistResult,
  type WatchlistSource,
} from "@crece/shared";
import type { FinancialAssessmentInput } from "@crece/domain";

const VALID_CHECKLIST_STATUSES: ChecklistItemStatus[] = [
  "PENDING",
  "UPLOADED",
  "CONFIRMED",
  "NOT_APPLICABLE",
  "MISSING_VISIBLE",
];

const VALID_WATCHLIST_SOURCES: WatchlistSource[] = [
  "OFAC",
  "ONU",
  "GUATECOMPRAS",
];

const VALID_WATCHLIST_RESULTS: WatchlistResult[] = [
  "CLEAR",
  "MATCH_FOUND",
  "PENDING_MANUAL_REVIEW",
];

/**
 * Contrato para actualizar un ítem del checklist de expediente (Fase 3).
 * Regla dura de instrucciones.txt: marcar 'no aplica' SIEMPRE exige justificación.
 */
export function parseUpdateChecklistItem(input: unknown): UpdateChecklistItemInput {
  if (typeof input !== "object" || input === null) {
    throw new ValidationError("Cuerpo de actualización de requisito inválido");
  }

  const body = input as Record<string, unknown>;
  const operationId = String(body.operationId ?? "").trim();
  const code = String(body.code ?? "").trim();
  const status = body.status as ChecklistItemStatus;
  const notApplicableReason =
    typeof body.notApplicableReason === "string" ? body.notApplicableReason.trim() : "";
  const documentId =
    typeof body.documentId === "string" && body.documentId.trim().length > 0
      ? toDocumentId(body.documentId.trim())
      : undefined;

  if (operationId.length === 0) {
    throw new ValidationError("El identificador de la operación es obligatorio");
  }

  if (code.length === 0) {
    throw new ValidationError("El código del requisito en el checklist es obligatorio");
  }

  if (!VALID_CHECKLIST_STATUSES.includes(status)) {
    throw new ValidationError("Estado de requisito de checklist no reconocido");
  }

  if (status === "NOT_APPLICABLE") {
    if (notApplicableReason.length < 5) {
      throw new ValidationError(
        "Para marcar un requisito como 'No aplica', es obligatorio registrar una justificación clara (mínimo 5 caracteres)",
      );
    }
  }

  return {
    operationId: toOperationId(operationId),
    code,
    status,
    notApplicableReason: status === "NOT_APPLICABLE" ? notApplicableReason : undefined,
    documentId,
  };
}

/**
 * Contrato para la captura manual de evaluación financiera (Fase 3).
 * Captura: ventas mensuales, ingresos mensuales, gastos y cuota de deudas existentes.
 */
export function parseFinancialAssessmentInput(input: unknown): UpdateFinancialAssessmentInput {
  if (typeof input !== "object" || input === null) {
    throw new ValidationError("Cuerpo de evaluación financiera inválido");
  }

  const body = input as Record<string, unknown>;
  const operationId = String(body.operationId ?? "").trim();
  const monthlySales = Number(body.monthlySales ?? 0);
  const monthlyIncome = Number(body.monthlyIncome ?? 0);
  const monthlyExpenses = Number(body.monthlyExpenses ?? 0);
  const existingDebtPayment = Number(body.existingDebtPayment ?? 0);
  const guaranteeValue =
    body.guaranteeValue !== undefined && body.guaranteeValue !== null
      ? Number(body.guaranteeValue)
      : undefined;
  const projectedRoiPercent =
    body.projectedRoiPercent !== undefined && body.projectedRoiPercent !== null
      ? Number(body.projectedRoiPercent)
      : undefined;

  if (operationId.length === 0) {
    throw new ValidationError("El identificador de la operación es obligatorio");
  }

  if (!Number.isFinite(monthlySales) || monthlySales < 0) {
    throw new ValidationError("Las ventas mensuales deben ser un número mayor o igual a 0");
  }

  if (!Number.isFinite(monthlyIncome) || monthlyIncome < 0) {
    throw new ValidationError("Los ingresos mensuales deben ser un número mayor o igual a 0");
  }

  if (!Number.isFinite(monthlyExpenses) || monthlyExpenses < 0) {
    throw new ValidationError("Los gastos mensuales deben ser un número mayor o igual a 0");
  }

  if (!Number.isFinite(existingDebtPayment) || existingDebtPayment < 0) {
    throw new ValidationError("El pago de deudas existentes debe ser un número mayor o igual a 0");
  }

  return {
    operationId: toOperationId(operationId),
    monthlySales,
    monthlyIncome,
    monthlyExpenses,
    existingDebtPayment,
    guaranteeValue: guaranteeValue !== undefined && Number.isFinite(guaranteeValue) ? guaranteeValue : undefined,
    projectedRoiPercent: projectedRoiPercent !== undefined && Number.isFinite(projectedRoiPercent) ? projectedRoiPercent : undefined,
  };
}

/**
 * Contrato para el fiador opcional y su evaluación (Fase 3).
 * Es intencionalmente flexible y tolerante a información parcial según instrucciones.txt.
 */
export function parseGuarantorInput(input: unknown): UpdateGuarantorInput {
  if (typeof input !== "object" || input === null) {
    throw new ValidationError("Cuerpo de datos del fiador inválido");
  }

  const body = input as Record<string, unknown>;
  const operationId = String(body.operationId ?? "").trim();
  const fullName = String(body.fullName ?? "").trim();

  if (operationId.length === 0) {
    throw new ValidationError("El identificador de la operación es obligatorio");
  }

  if (fullName.length < 3) {
    throw new ValidationError("El nombre del fiador debe tener al menos 3 caracteres");
  }

  const dpi = typeof body.dpi === "string" && body.dpi.trim().length > 0 ? body.dpi.trim() : undefined;
  const phone = typeof body.phone === "string" && body.phone.trim().length > 0 ? body.phone.trim() : undefined;
  const relationship = typeof body.relationship === "string" ? body.relationship.trim() : undefined;
  const notes = typeof body.notes === "string" ? body.notes.trim() : undefined;
  const bureauDocumentId =
    typeof body.bureauDocumentId === "string" && body.bureauDocumentId.trim().length > 0
      ? toDocumentId(body.bureauDocumentId.trim())
      : undefined;

  let financialAssessment: UpdateGuarantorInput["financialAssessment"] = undefined;
  if (typeof body.financialAssessment === "object" && body.financialAssessment !== null) {
    const f = body.financialAssessment as Record<string, unknown>;
    financialAssessment = {
      monthlyIncome: Number(f.monthlyIncome ?? 0),
      monthlyExpenses: Number(f.monthlyExpenses ?? 0),
      existingDebtPayment: Number(f.existingDebtPayment ?? 0),
      guaranteeValue: f.guaranteeValue ? Number(f.guaranteeValue) : undefined,
    };
  }

  return {
    operationId: toOperationId(operationId),
    fullName,
    dpi,
    phone,
    relationship: relationship || undefined,
    financialAssessment,
    bureauDocumentId,
    notes: notes || undefined,
  };
}

/**
 * Contrato para registrar consultas a listas de control (Fase 3: OFAC, ONU, Guatecompras).
 */
export function parseWatchlistCheckInput(input: unknown): RecordWatchlistCheckInput {
  if (typeof input !== "object" || input === null) {
    throw new ValidationError("Cuerpo de consulta a listas de control inválido");
  }

  const body = input as Record<string, unknown>;
  const operationId = String(body.operationId ?? "").trim();
  const source = body.source as WatchlistSource;
  const queryRef = String(body.queryRef ?? "").trim();
  const result = body.result as WatchlistResult;
  const checkedByUserId = String(body.checkedByUserId ?? "").trim();
  const notes = typeof body.notes === "string" ? body.notes.trim() : undefined;

  if (operationId.length === 0) {
    throw new ValidationError("El identificador de la operación es obligatorio");
  }

  if (!VALID_WATCHLIST_SOURCES.includes(source)) {
    throw new ValidationError("Fuente de lista de control inválida (debe ser OFAC, ONU o GUATECOMPRAS)");
  }

  if (queryRef.length === 0) {
    throw new ValidationError("La referencia de consulta (DPI o nombre) es obligatoria");
  }

  if (!VALID_WATCHLIST_RESULTS.includes(result)) {
    throw new ValidationError("Resultado de verificación en lista inválido");
  }

  if (checkedByUserId.length === 0) {
    throw new ValidationError("El usuario que realiza la consulta es obligatorio");
  }

  return {
    operationId: toOperationId(operationId),
    source,
    queryRef,
    result,
    notes: notes || undefined,
    checkedByUserId: toUserId(checkedByUserId),
  };
}
