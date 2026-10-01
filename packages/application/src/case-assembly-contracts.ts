import {
  ValidationError,
  type ChecklistItemStatus,
  type WatchlistResult,
  type WatchlistSource,
} from "@crece/shared";
import type {
  ChecklistItemUpdate,
  FinancialAssessmentInput,
  GuarantorAssessmentInput,
  GuarantorUpdate,
} from "@crece/domain";

/**
 * Contratos de entrada del armado del expediente (fase 3). La operación sale de la ruta
 * y el usuario de la sesión: el cuerpo solo trae lo que el asesor capturó.
 * Las reglas (código existente, motivo de «No aplica», DPI del fiador) viven en dominio.
 */

const VALID_CHECKLIST_STATUSES: ChecklistItemStatus[] = [
  "PENDING",
  "UPLOADED",
  "CONFIRMED",
  "NOT_APPLICABLE",
  "MISSING_VISIBLE",
];
const VALID_WATCHLIST_SOURCES: WatchlistSource[] = ["OFAC", "ONU", "GUATECOMPRAS"];
const VALID_WATCHLIST_RESULTS: WatchlistResult[] = ["CLEAR", "MATCH_FOUND", "PENDING_MANUAL_REVIEW"];

export function parseChecklistItemUpdate(input: unknown): ChecklistItemUpdate {
  const body = asRecord(input, "Cuerpo de actualización de requisito inválido");
  const code = String(body.code ?? "").trim();
  const status = body.status as ChecklistItemStatus;
  if (code.length === 0) {
    throw new ValidationError("Indica el código del requisito");
  }
  if (!VALID_CHECKLIST_STATUSES.includes(status)) {
    throw new ValidationError("Estado de requisito no reconocido");
  }
  return {
    code,
    status,
    notApplicableReason: optionalText(body.notApplicableReason),
    documentId: optionalText(body.documentId),
  };
}

export function parseFinancialAssessment(input: unknown): FinancialAssessmentInput {
  const body = asRecord(input, "Cuerpo de evaluación financiera inválido");
  return {
    monthlySales: requiredAmount(body.monthlySales, "Las ventas mensuales"),
    monthlyIncome: requiredAmount(body.monthlyIncome, "Los ingresos mensuales"),
    monthlyExpenses: requiredAmount(body.monthlyExpenses, "Los gastos mensuales"),
    existingDebtPayment: requiredAmount(body.existingDebtPayment, "La cuota de deudas actuales"),
    guaranteeValue: optionalAmount(body.guaranteeValue, "El valor de la garantía"),
    projectedRoiPercent: optionalNumber(body.projectedRoiPercent, "El ROI proyectado"),
  };
}

/** El fiador es flexible: basta el nombre; lo demás se completa cuando llegue. */
export function parseGuarantor(input: unknown): GuarantorUpdate {
  const body = asRecord(input, "Cuerpo de datos del fiador inválido");
  const fullName = String(body.fullName ?? "").trim();
  if (fullName.length < 3) {
    throw new ValidationError("Escribe el nombre del fiador (al menos 3 caracteres)");
  }

  let assessment: GuarantorAssessmentInput | undefined;
  if (body.financialAssessment !== undefined && body.financialAssessment !== null) {
    const f = asRecord(body.financialAssessment, "Evaluación del fiador inválida");
    assessment = {
      monthlyIncome: requiredAmount(f.monthlyIncome, "Los ingresos del fiador"),
      monthlyExpenses: requiredAmount(f.monthlyExpenses, "Los gastos del fiador"),
      existingDebtPayment: requiredAmount(f.existingDebtPayment, "La cuota de deudas del fiador"),
      guaranteeValue: optionalAmount(f.guaranteeValue, "El valor de la garantía del fiador"),
    };
  }

  return {
    guarantor: {
      fullName,
      dpi: optionalText(body.dpi),
      phone: optionalText(body.phone),
      relationship: optionalText(body.relationship),
    },
    assessment,
  };
}

export type WatchlistCheckInput = {
  source: WatchlistSource;
  queryRef: string;
  result: WatchlistResult;
  notes?: string;
};

export function parseWatchlistCheck(input: unknown): WatchlistCheckInput {
  const body = asRecord(input, "Cuerpo de consulta a listas de control inválido");
  const source = body.source as WatchlistSource;
  const result = body.result as WatchlistResult;
  const queryRef = String(body.queryRef ?? "").trim();
  if (!VALID_WATCHLIST_SOURCES.includes(source)) {
    throw new ValidationError("La lista debe ser OFAC, ONU o Guatecompras");
  }
  if (queryRef.length === 0) {
    throw new ValidationError("Indica qué se consultó (DPI o nombre)");
  }
  if (!VALID_WATCHLIST_RESULTS.includes(result)) {
    throw new ValidationError("Resultado de consulta no reconocido");
  }
  const notes = optionalText(body.notes);
  if (result === "MATCH_FOUND" && !notes) {
    throw new ValidationError("Una coincidencia debe llevar nota: qué registro coincidió y con qué datos");
  }
  return { source, queryRef, result, notes };
}

function asRecord(input: unknown, message: string): Record<string, unknown> {
  if (typeof input !== "object" || input === null) {
    throw new ValidationError(message);
  }
  return input as Record<string, unknown>;
}

function optionalText(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function isBlank(value: unknown): boolean {
  return value === undefined || value === null || (typeof value === "string" && value.trim() === "");
}

function requiredAmount(value: unknown, field: string): number {
  if (isBlank(value)) {
    throw new ValidationError(`${field} es un dato obligatorio`);
  }
  return nonNegative(value, field);
}

/** Un dato opcional puede venir vacío; si viene, tiene que ser un número válido (no se descarta en silencio). */
function optionalAmount(value: unknown, field: string): number | undefined {
  return isBlank(value) ? undefined : nonNegative(value, field);
}

function optionalNumber(value: unknown, field: string): number | undefined {
  if (isBlank(value)) return undefined;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) {
    throw new ValidationError(`${field} debe ser un número`);
  }
  return n;
}

function nonNegative(value: unknown, field: string): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) {
    throw new ValidationError(`${field} debe ser un número mayor o igual a 0`);
  }
  return n;
}
