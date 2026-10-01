import {
  CAPTURE_AUDIT_ACTION_LABELS,
  CHECKLIST_STATUS_LABELS,
  WATCHLIST_RESULT_LABELS,
  WATCHLIST_SOURCE_LABELS,
  formatGtq,
  type CaptureAuditAction,
  type ChecklistItemStatus,
  type HardRuleSeverity,
  type Office,
  type OperationState,
  type PersonStatus,
  type WatchlistResult,
} from "@crece/shared";

/**
 * Traducciones de estado a tono visual del design system. Solo presentación:
 * ninguna regla de negocio se decide aquí (eso vive en @crece/domain y la API).
 */
export type Tone = "info" | "success" | "warning" | "danger" | "neutral";

const OPERATION_TONES: Record<OperationState, Tone> = {
  DRAFT: "neutral",
  READY_FOR_REVIEW: "info",
  UNDER_REVIEW: "info",
  RETURNED_TO_ADVISOR: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  PACKAGED: "success",
};

const CHECKLIST_TONES: Record<ChecklistItemStatus, Tone> = {
  PENDING: "neutral",
  UPLOADED: "info",
  CONFIRMED: "success",
  NOT_APPLICABLE: "neutral",
  MISSING_VISIBLE: "warning",
};

const WATCHLIST_TONES: Record<WatchlistResult | "MISSING", Tone> = {
  CLEAR: "success",
  MATCH_FOUND: "danger",
  PENDING_MANUAL_REVIEW: "warning",
  MISSING: "neutral",
};

export const operationStateTone = (state: OperationState): Tone => OPERATION_TONES[state];
export const checklistTone = (status: ChecklistItemStatus): Tone => CHECKLIST_TONES[status];
export const watchlistTone = (result: WatchlistResult | "MISSING"): Tone => WATCHLIST_TONES[result];
export const personStatusTone = (status: PersonStatus): Tone => (status === "ACTIVE" ? "success" : status === "PROSPECT" ? "info" : "neutral");
export const hardRuleTone = (severity: HardRuleSeverity): "warning" | "danger" => (severity === "BLOCK" ? "danger" : "warning");

/** Avance del checklist: requisitos obligatorios resueltos sobre el total obligatorio. */
export function checklistProgress(items: { required: boolean; status: ChecklistItemStatus }[]) {
  const required = items.filter((i) => i.required);
  return { done: required.filter((i) => i.status !== "PENDING").length, total: required.length };
}

export function auditActionLabel(action: string): string {
  return CAPTURE_AUDIT_ACTION_LABELS[action as CaptureAuditAction] ?? action;
}

type AuditLike = { action: string; field: string; oldValue?: string; newValue?: string };

/** Detalle legible de una entrada de bitácora; los códigos internos se traducen a sus etiquetas. */
export function auditDescription(entry: AuditLike, checklistLabels: Record<string, string>): string | undefined {
  const status = (v?: string) => (v ? CHECKLIST_STATUS_LABELS[v as ChecklistItemStatus] ?? v : "—");
  switch (entry.action) {
    case "CHECKLIST_ITEM_UPDATED":
      return `${checklistLabels[entry.field] ?? entry.field}: ${status(entry.oldValue)} → ${status(entry.newValue)}`;
    case "WATCHLIST_CHECKED":
      return `${WATCHLIST_SOURCE_LABELS[entry.field as keyof typeof WATCHLIST_SOURCE_LABELS] ?? entry.field}: ${
        WATCHLIST_RESULT_LABELS[entry.newValue as WatchlistResult] ?? entry.newValue
      }`;
    case "OPERATION_OPENED":
      return entry.newValue ? `Monto solicitado ${formatGtq(entry.newValue)}` : undefined;
    case "ASSESSMENT_RECORDED":
      return entry.oldValue ? "Datos actualizados; el motor recalculó" : "Primer cálculo del motor";
    default:
      return undefined;
  }
}

export type PermissionMatrix = Record<string, Office[]>;

/** Matriz que publica la API en /catalog; la API vuelve a validar cada acción. */
export function can(matrix: PermissionMatrix, offices: Office[], permission: string): boolean {
  return (matrix[permission] ?? []).some((office) => offices.includes(office));
}

export function money(amount: string | number): string {
  return formatGtq(amount);
}

export function percent(ratio: number | null | undefined): string {
  return ratio === null || ratio === undefined ? "—" : `${(ratio * 100).toFixed(1)}%`;
}

export function dateTime(iso: string | undefined): string {
  return iso
    ? new Date(iso).toLocaleString("es-GT", { timeZone: "America/Guatemala", dateStyle: "medium", timeStyle: "short" })
    : "—";
}

/** Fila de AmortizationTable (design system) a partir de la tabla del motor. */
export function toAmortizationRows(schedule: { period: number; payment: number; principal: number; interest: number; balance: number }[]) {
  return schedule.map((row) => ({
    month: row.period,
    payment: row.payment,
    capital: row.principal,
    interest: row.interest,
    balance: row.balance,
  }));
}

/** Campo de monto opcional: vacío no se envía; lo demás se manda tal cual para que la API valide. */
export function optionalAmount(value: number | ""): number | undefined {
  return value === "" ? undefined : value;
}

/** Dígitos del DPI tal como se capturó (con espacios o guiones); la API lo valida y normaliza. */
export function dpiDigits(raw: string): string {
  return raw.replace(/\D/g, "");
}
