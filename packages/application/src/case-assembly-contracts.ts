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
import { normalizeDpi } from "./person-contracts";

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

  if (operationId.length === 0) {
    throw new ValidationError("El identificador de la operación es obligatorio");
  }

  const monthlySales = readNonNegativeAmount(body.monthlySales, "Las ventas mensuales", true);
  const monthlyIncome = readNonNegativeAmount(body.monthlyIncome, "Los ingresos mensuales", true);
  const monthlyExpenses = readNonNegativeAmount(body.monthlyExpenses, "Los gastos mensuales", true);
  const existingDebtPayment = readNonNegativeAmount(
    body.existingDebtPayment,
    "El pago de deudas existentes",
    true,
  );
  const guaranteeValue = readNonNegativeAmount(body.guaranteeValue, "El valor de la garantía", false);
  const projectedRoiPercent = readNonNegativeAmount(
    body.projectedRoiPercent,
    "El retorno proyectado",
    false,
  );

  return {
    operationId: toOperationId(operationId),
    monthlySales: monthlySales!,
    monthlyIncome: monthlyIncome!,
    monthlyExpenses: monthlyExpenses!,
    existingDebtPayment: existingDebtPayment!,
    guaranteeValue,
    projectedRoiPercent,
  };
}

/**
 * Un dato presente que no es numérico es un error. No se descarta en silencio.
 * `required` obliga a que el campo venga informado.
 */
export function readNonNegativeAmount(
  value: unknown,
  label: string,
  required: boolean,
): number | undefined {
  if (value === undefined || value === null || value === "") {
    if (required) {
      throw new ValidationError(`${label} es obligatorio y debe ser un número`);
    }
    return undefined;
  }
  if (typeof value === "boolean") {
    throw new ValidationError(`${label} debe ser un número`);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new ValidationError(`${label} debe ser un número`);
    }
    if (value < 0) {
      throw new ValidationError(`${label} debe ser un número mayor o igual a 0`);
    }
    return value;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!/^\d+(\.\d+)?$/.test(trimmed)) {
      throw new ValidationError(`${label} debe ser un número. «${trimmed}» no es numérico`);
    }
    return Number(trimmed);
  }
  throw new ValidationError(`${label} debe ser un número`);
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

  const dpi =
    typeof body.dpi === "string" && body.dpi.trim().length > 0
      ? normalizeDpi(body.dpi)
      : undefined;
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
      monthlyIncome: readNonNegativeAmount(f.monthlyIncome, "Los ingresos del fiador", true)!,
      monthlyExpenses: readNonNegativeAmount(f.monthlyExpenses, "Los gastos del fiador", true)!,
      existingDebtPayment: readNonNegativeAmount(
        f.existingDebtPayment,
        "Las deudas del fiador",
        true,
      )!,
      guaranteeValue: readNonNegativeAmount(
        f.guaranteeValue,
        "La garantía del fiador",
        false,
      ),
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
