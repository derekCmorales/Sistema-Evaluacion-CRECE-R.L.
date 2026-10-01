import {
  InvariantViolationError,
  ValidationError,
  type CaseAssemblyGap,
  type ChecklistItemStatus,
  type OperationState,
  type UserId,
  type WatchlistResult,
  type WatchlistSource,
} from "@crece/shared";
import {
  createChecklistItems,
  isChecklistReadyForReview,
  type ChecklistItem,
  type ChecklistResolverInput,
} from "./checklist-resolver";
import type { Guarantor, Operation, WatchlistCheck } from "./entities";
import type { GuarantorAssessmentInput } from "./calc-engine";
import { normalizeDpi } from "./person-identity";

/** Fase 3 solo edita expedientes en manos del asesor. */
export const CASE_EDITABLE_STATES: readonly OperationState[] = ["DRAFT", "RETURNED_TO_ADVISOR"];

export function assertCaseEditable(operation: Pick<Operation, "state">): void {
  if (!CASE_EDITABLE_STATES.includes(operation.state)) {
    throw new InvariantViolationError(
      "El expediente solo se edita en borrador o cuando fue devuelto al asesor",
    );
  }
}

export const NOT_APPLICABLE_REASON_MIN_LENGTH = 5;

export type ChecklistItemUpdate = {
  code: string;
  status: ChecklistItemStatus;
  notApplicableReason?: string;
  documentId?: string;
};

/**
 * Cambia el estado de una casilla. Un código que no está en el checklist de esta
 * solicitud es un error (no un éxito silencioso), y «No aplica» siempre lleva motivo.
 */
export function applyChecklistUpdate(
  items: ChecklistItem[],
  update: ChecklistItemUpdate,
): ChecklistItem[] {
  if (!items.some((item) => item.code === update.code)) {
    throw new ValidationError(`El requisito ${update.code} no forma parte del checklist de esta solicitud`);
  }
  const reason = update.notApplicableReason?.trim() ?? "";
  if (update.status === "NOT_APPLICABLE" && reason.length < NOT_APPLICABLE_REASON_MIN_LENGTH) {
    throw new ValidationError(
      `Para marcar «No aplica» escribe el motivo (al menos ${NOT_APPLICABLE_REASON_MIN_LENGTH} caracteres)`,
    );
  }
  return items.map((item) =>
    item.code === update.code
      ? {
          ...item,
          status: update.status,
          notApplicableReason: update.status === "NOT_APPLICABLE" ? reason : undefined,
          documentId: update.documentId ?? item.documentId,
        }
      : item,
  );
}

/**
 * Regenera el checklist cuando cambian producto, garantía o fiador, sin perder lo avanzado:
 * las casillas que siguen aplicando conservan estado, motivo y documento; las nuevas entran pendientes.
 */
export function reconcileChecklist(
  current: ChecklistItem[],
  input: ChecklistResolverInput,
): ChecklistItem[] {
  const byCode = new Map(current.map((item) => [item.code, item]));
  return createChecklistItems(input).map((fresh) => {
    const previous = byCode.get(fresh.code);
    return previous
      ? {
          ...fresh,
          status: previous.status,
          notApplicableReason: previous.notApplicableReason,
          documentId: previous.documentId,
          issuedAt: previous.issuedAt,
        }
      : fresh;
  });
}

export type GuarantorUpdate = {
  guarantor: Guarantor;
  assessment?: GuarantorAssessmentInput;
};

/**
 * Registra o actualiza al fiador. Si la solicitud no tenía fiador, desde ahora lo tiene
 * y el checklist suma sus requisitos (DPI, ingresos y buró del fiador).
 */
export function applyGuarantor(operation: Operation, update: GuarantorUpdate): Operation {
  const guarantor: Guarantor = {
    ...update.guarantor,
    dpi: update.guarantor.dpi === undefined ? undefined : normalizeDpi(update.guarantor.dpi),
  };
  return {
    ...operation,
    hasGuarantor: true,
    guarantor,
    guarantorAssessment: update.assessment ?? operation.guarantorAssessment,
    checklist: operation.hasGuarantor
      ? operation.checklist
      : reconcileChecklist(operation.checklist, {
          productType: operation.productType,
          guaranteeType: operation.guaranteeType,
          hasGuarantor: true,
        }),
  };
}

export function isGuarantorComplete(operation: Operation): boolean {
  if (!operation.hasGuarantor) return true;
  return Boolean(operation.guarantor?.fullName && operation.guarantorAssessment);
}

export type WatchlistSourceStatus = {
  source: WatchlistSource;
  result: WatchlistResult | "MISSING";
  latest?: WatchlistCheck;
};

/** Por fuente vale la consulta más reciente: una nueva consulta reemplaza a la anterior. */
export function summarizeWatchlist(
  checks: WatchlistCheck[],
  requiredSources: readonly WatchlistSource[],
): WatchlistSourceStatus[] {
  return requiredSources.map((source) => {
    const latest = checks
      .filter((check) => check.source === source)
      .reduce<WatchlistCheck | undefined>(
        (newest, check) => (!newest || check.checkedAt >= newest.checkedAt ? check : newest),
        undefined,
      );
    return { source, result: latest?.result ?? "MISSING", latest };
  });
}

export type CaseAssemblyStatus = {
  checklistComplete: boolean;
  pendingChecklistCount: number;
  missingVisibleCount: number;
  hasFinancialAssessment: boolean;
  guarantorComplete: boolean;
  watchlist: WatchlistSourceStatus[];
  /** Todas las listas requeridas consultadas y la consulta vigente sin coincidencias. */
  watchlistCleared: boolean;
  gaps: CaseAssemblyGap[];
  /** Sin huecos: el expediente puede marcarse armado y seguir a cálculo y dictamen. */
  readyForReview: boolean;
  assembledByUserId?: UserId;
  assembledAt?: string;
};

/**
 * Completitud del expediente (fase 3). Una coincidencia o una revisión manual en listas
 * de control nunca cuenta como «consultada»: deja el expediente con un hueco visible.
 */
export function evaluateCaseAssembly(
  operation: Operation,
  requiredWatchlistSources: readonly WatchlistSource[],
): CaseAssemblyStatus {
  const checklistComplete = isChecklistReadyForReview(operation.checklist);
  const watchlist = summarizeWatchlist(operation.watchlistChecks ?? [], requiredWatchlistSources);
  const hasFinancialAssessment = operation.assessment !== undefined;
  const guarantorComplete = isGuarantorComplete(operation);

  const gaps: CaseAssemblyGap[] = [];
  if (!checklistComplete) gaps.push("CHECKLIST_PENDING");
  if (!hasFinancialAssessment) gaps.push("ASSESSMENT_MISSING");
  if (!guarantorComplete) gaps.push("GUARANTOR_INCOMPLETE");
  if (watchlist.some((s) => s.result === "MISSING")) gaps.push("WATCHLIST_MISSING");
  if (watchlist.some((s) => s.result === "PENDING_MANUAL_REVIEW")) gaps.push("WATCHLIST_PENDING_REVIEW");
  if (watchlist.some((s) => s.result === "MATCH_FOUND")) gaps.push("WATCHLIST_MATCH");

  return {
    checklistComplete,
    pendingChecklistCount: operation.checklist.filter((i) => i.required && i.status === "PENDING").length,
    missingVisibleCount: operation.checklist.filter((i) => i.status === "MISSING_VISIBLE").length,
    hasFinancialAssessment,
    guarantorComplete,
    watchlist,
    watchlistCleared: watchlist.every((s) => s.result === "CLEAR"),
    gaps,
    readyForReview: gaps.length === 0,
    assembledByUserId: operation.assembledByUserId,
    assembledAt: operation.assembledAt,
  };
}

/** Deja constancia de quién armó el expediente. Solo un expediente sin huecos se marca armado. */
export function markAssembled(
  operation: Operation,
  requiredWatchlistSources: readonly WatchlistSource[],
  byUserId: UserId,
  at: string,
): Operation {
  assertCaseEditable(operation);
  const status = evaluateCaseAssembly(operation, requiredWatchlistSources);
  if (!status.readyForReview) {
    throw new InvariantViolationError("El expediente aún tiene huecos; complétalos antes de marcarlo armado");
  }
  return { ...operation, assembledByUserId: byUserId, assembledAt: at };
}

/** Cualquier cambio posterior invalida la constancia de armado: hay que volver a revisarlo. */
export function clearAssembly(operation: Operation): Operation {
  return { ...operation, assembledByUserId: undefined, assembledAt: undefined };
}
