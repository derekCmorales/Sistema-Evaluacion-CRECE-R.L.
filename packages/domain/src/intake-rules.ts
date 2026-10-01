import {
  NotFoundError,
  ValidationError,
  InvariantViolationError,
  type ChecklistItemStatus,
  type PersonStatus,
  type ProspectInterest,
  type WatchlistResult,
  type WatchlistSource,
  type UserId,
} from "@crece/shared";
import type { ChecklistItem } from "./checklist-resolver";
import { createChecklistItems, type ChecklistResolverInput } from "./checklist-resolver";
import type { Person } from "./entities";

/** Toda persona nace como prospecto, también la que registra el asesor. */
export function personBirthStatus(): PersonStatus {
  return "PROSPECT";
}

export type ProspectCompletion = {
  dpi: string;
  fullName: string;
  phone: string;
  email?: string;
  interest: ProspectInterest;
  registeredByUserId?: UserId;
};

/**
 * Completa un prospecto ya existente (típicamente de la landing) con su DPI.
 * No crea otra persona.
 */
export function completeProspectIdentity(person: Person, patch: ProspectCompletion): Person {
  if (person.dpi && person.dpi !== patch.dpi) {
    throw new InvariantViolationError(
      "Esta persona ya tiene otro DPI. No se registra un perfil duplicado.",
    );
  }
  return {
    ...person,
    fullName: patch.fullName,
    dpi: patch.dpi,
    contacts: { phone: patch.phone, email: patch.email ?? person.contacts.email },
    interest: patch.interest,
    status: personBirthStatus(),
    registeredByUserId: patch.registeredByUserId ?? person.registeredByUserId,
  };
}

/** Un borrador exige una persona que ya exista y tenga DPI de 13 dígitos. */
export function assertPersonEligibleForDraft(
  person: Person | null | undefined,
): asserts person is Person {
  if (!person) {
    throw new NotFoundError(
      "La persona no existe. No se abre un borrador sin solicitante.",
    );
  }
  if (!person.dpi || !/^\d{13}$/.test(person.dpi)) {
    throw new ValidationError(
      "La persona debe tener DPI de 13 dígitos antes de abrir un borrador.",
    );
  }
}

export type ChecklistItemUpdate = {
  code: string;
  status: ChecklistItemStatus;
  notApplicableReason?: string;
  documentId?: string;
};

/** Un código que no está en el checklist del expediente es un error, no un no-op. */
export function applyChecklistItem(
  items: ChecklistItem[],
  update: ChecklistItemUpdate,
): ChecklistItem[] {
  const index = items.findIndex((item) => item.code === update.code);
  if (index < 0) {
    throw new ValidationError(
      `El código de checklist «${update.code}» no existe en este expediente.`,
    );
  }
  const current = items[index]!;
  const next = items.slice();
  next[index] = {
    ...current,
    status: update.status,
    notApplicableReason:
      update.status === "NOT_APPLICABLE" ? update.notApplicableReason : undefined,
    documentId: update.documentId ?? current.documentId,
  };
  return next;
}

/**
 * Regenera el checklist (por ejemplo al agregar fiador) y conserva
 * el avance de los códigos que siguen aplicando.
 */
export function mergeChecklistPreservingProgress(
  current: ChecklistItem[],
  input: ChecklistResolverInput,
): ChecklistItem[] {
  const fresh = createChecklistItems(input);
  const previous = new Map(current.map((item) => [item.code, item]));
  return fresh.map((item) => {
    const kept = previous.get(item.code);
    if (!kept) return item;
    return {
      ...item,
      status: kept.status,
      notApplicableReason: kept.notApplicableReason,
      documentId: kept.documentId,
      issuedAt: kept.issuedAt,
    };
  });
}

export type WatchlistGapReason = "MISSING" | "MATCH_FOUND" | "PENDING_MANUAL_REVIEW";

export type WatchlistGap = {
  source: WatchlistSource;
  reason: WatchlistGapReason;
};

export type WatchlistCheckView = {
  source: WatchlistSource;
  result: WatchlistResult;
};

/**
 * Las listas requeridas vienen de configuración.
 * Una coincidencia o una revisión manual deja un hueco visible.
 * Solo CLEAR cierra esa lista.
 */
export function evaluateWatchlistCoverage(
  checks: readonly WatchlistCheckView[],
  requiredSources: readonly WatchlistSource[],
): { gaps: WatchlistGap[]; clear: boolean } {
  const latest = new Map<WatchlistSource, WatchlistResult>();
  for (const check of checks) {
    latest.set(check.source, check.result);
  }
  const gaps: WatchlistGap[] = [];
  for (const source of requiredSources) {
    const result = latest.get(source);
    if (!result) {
      gaps.push({ source, reason: "MISSING" });
    } else if (result === "MATCH_FOUND") {
      gaps.push({ source, reason: "MATCH_FOUND" });
    } else if (result === "PENDING_MANUAL_REVIEW") {
      gaps.push({ source, reason: "PENDING_MANUAL_REVIEW" });
    }
  }
  return { gaps, clear: gaps.length === 0 };
}
