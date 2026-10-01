import {
  DEFAULT_RATES_CONFIG,
  DEFAULT_REQUIRED_WATCHLIST_SOURCES,
  InvariantViolationError,
  NotFoundError,
  maskDpi,
  toOperationId,
  toUserId,
  type CaseAssemblyStatusDto,
  type Office,
  type PersonSummaryDto,
  type UserId,
  type WatchlistSource,
} from "@crece/shared";
import {
  applyChecklistItem,
  assertPersonEligibleForDraft,
  calculateCreditMetrics,
  completeProspectIdentity,
  evaluateHardRules,
  evaluateWatchlistCoverage,
  isChecklistReadyForReview,
  mergeChecklistPreservingProgress,
  recordSensitiveChange,
  type AuditEntry,
  type Operation,
  type Person,
} from "@crece/domain";
import { assertPermission } from "./rbac";
import { parseCreatePerson, toPersonEntity } from "./person-contracts";
import { parseCreateDraftOperation, toDraftOperationEntity } from "./operation-contracts";
import {
  parseFinancialAssessmentInput,
  parseGuarantorInput,
  parseUpdateChecklistItem,
  parseWatchlistCheckInput,
} from "./case-assembly-contracts";
import { parsePublicProspect, toProspectPerson, type PublicProspectInput } from "./public-prospect";

export type IntakeActor = {
  userId: UserId;
  offices: Office[];
};

export type PersonDirectory = {
  findById(id: string): Person | null;
  findByDpi(dpi: string): Person | null;
  findOpenProspectByPhone(phone: string): Person | null;
  list(): Person[];
  save(person: Person): Person;
};

export type OperationDirectory = {
  findById(id: string): Operation | null;
  findByPersonId(personId: string): Operation[];
  list(): Operation[];
  save(operation: Operation): Operation;
};

export type AuditSink = {
  append(entry: Omit<AuditEntry, "id" | "at">): void;
};

export type IntakeDeps = {
  persons: PersonDirectory;
  operations: OperationDirectory;
  audit: AuditSink;
  now: () => string;
  newId: () => string;
  /** Semilla o fila de configuración. No es una constante de pantalla. */
  requiredWatchlists?: readonly WatchlistSource[];
};

function requiredLists(deps: IntakeDeps): readonly WatchlistSource[] {
  return deps.requiredWatchlists ?? DEFAULT_REQUIRED_WATCHLIST_SOURCES;
}

function phoneKey(phone: string): string {
  return phone.replace(/\D/g, "");
}

function writeAudit(
  deps: IntakeDeps,
  input: {
    entityType: string;
    entityId: string;
    field: string;
    oldValue?: string | number | null;
    newValue?: string | number | null;
    action: string;
    byUserId: UserId;
  },
): void {
  deps.audit.append(recordSensitiveChange(input));
}

export function capturePublicProspect(
  deps: IntakeDeps,
  raw: unknown,
): Person {
  const parsed: PublicProspectInput = parsePublicProspect(raw);
  const match = deps.persons.findOpenProspectByPhone(parsed.phone);
  if (match && phoneKey(match.contacts.phone) === phoneKey(parsed.phone)) {
    return match;
  }
  const person = toProspectPerson(parsed, deps.newId(), deps.now());
  const stored = deps.persons.save(person);
  writeAudit(deps, {
    entityType: "Person",
    entityId: stored.id,
    field: "status",
    newValue: stored.status,
    action: "prospect.capture",
    byUserId: toUserId("landing"),
  });
  return stored;
}

export function registerPerson(
  deps: IntakeDeps,
  raw: unknown,
  actor: IntakeActor,
): Person {
  assertPermission(actor.offices, "person:create");
  const parsed = parseCreatePerson(raw);
  const byDpi = deps.persons.findByDpi(parsed.dpi);

  const target =
    (parsed.existingPersonId
      ? deps.persons.findById(parsed.existingPersonId)
      : null) ?? deps.persons.findOpenProspectByPhone(parsed.phone);

  if (parsed.existingPersonId && !deps.persons.findById(parsed.existingPersonId)) {
    throw new NotFoundError("El prospecto que quiere completar no existe");
  }

  if (target && (!target.dpi || target.dpi === parsed.dpi)) {
    if (byDpi && byDpi.id !== target.id) {
      throw new InvariantViolationError(
        `Ya existe una persona registrada con el DPI ${parsed.dpi}.`,
      );
    }
    const completed = completeProspectIdentity(target, {
      dpi: parsed.dpi,
      fullName: parsed.fullName,
      phone: parsed.phone,
      email: parsed.email,
      interest: parsed.interest,
      registeredByUserId: parsed.registeredByUserId ?? actor.userId,
    });
    const stored = deps.persons.save(completed);
    writeAudit(deps, {
      entityType: "Person",
      entityId: stored.id,
      field: "dpi",
      oldValue: target.dpi ?? null,
      newValue: maskDpi(stored.dpi ?? ""),
      action: "person.complete",
      byUserId: actor.userId,
    });
    return stored;
  }

  if (byDpi) {
    throw new InvariantViolationError(
      `Ya existe una persona registrada con el DPI ${parsed.dpi}.`,
    );
  }

  const person = toPersonEntity(parsed, deps.newId(), deps.now());
  const stored = deps.persons.save(person);
  writeAudit(deps, {
    entityType: "Person",
    entityId: stored.id,
    field: "status",
    newValue: stored.status,
    action: "person.register",
    byUserId: actor.userId,
  });
  return stored;
}

export function listPersons(deps: IntakeDeps, actor: IntakeActor): PersonSummaryDto[] {
  assertPermission(actor.offices, "person:read");
  return deps.persons.list().map((person) => ({
    id: person.id,
    fullName: person.fullName,
    dpi: person.dpi ? maskDpi(person.dpi) : "",
    phone: person.contacts.phone,
    email: person.contacts.email,
    status: person.status,
    source: person.source ?? "ADVISOR",
    interest: person.interest,
    registeredByUserId: person.registeredByUserId,
    createdAt: person.createdAt,
    operationsCount: deps.operations.findByPersonId(person.id).length,
  }));
}

export function getPerson(
  deps: IntakeDeps,
  personId: string,
  actor: IntakeActor,
): Person & { operations: Operation[] } {
  assertPermission(actor.offices, "person:read");
  const person = deps.persons.findById(personId);
  if (!person) throw new NotFoundError("Persona no encontrada");
  return { ...person, operations: deps.operations.findByPersonId(person.id) };
}

export function openDraftOperation(
  deps: IntakeDeps,
  raw: unknown,
  actor: IntakeActor,
): Operation {
  assertPermission(actor.offices, "operation:create");
  const parsed = parseCreateDraftOperation(raw);
  const person = deps.persons.findById(parsed.personId);
  assertPersonEligibleForDraft(person);
  const operation = toDraftOperationEntity(parsed, deps.newId(), deps.now());
  const stored = deps.operations.save(operation);
  writeAudit(deps, {
    entityType: "Operation",
    entityId: stored.id,
    field: "state",
    newValue: stored.state,
    action: "operation.open-draft",
    byUserId: actor.userId,
  });
  return stored;
}

export function updateOperationChecklist(
  deps: IntakeDeps,
  operationId: string,
  raw: unknown,
  actor: IntakeActor,
): Operation {
  assertPermission(actor.offices, "operation:edit");
  const parsed = parseUpdateChecklistItem(
    typeof raw === "object" && raw !== null ? { ...(raw as object), operationId } : { operationId },
  );
  const current = deps.operations.findById(operationId);
  if (!current) throw new NotFoundError(`Operación con id ${operationId} no encontrada`);
  const checklist = applyChecklistItem(current.checklist, parsed);
  const stored = deps.operations.save({
    ...current,
    checklist,
    updatedAt: deps.now(),
  });
  writeAudit(deps, {
    entityType: "Operation",
    entityId: stored.id,
    field: `checklist.${parsed.code}`,
    newValue: parsed.status,
    action: "checklist.update",
    byUserId: actor.userId,
  });
  return stored;
}

export function recordFinancialAssessment(
  deps: IntakeDeps,
  operationId: string,
  raw: unknown,
  actor: IntakeActor,
): Operation {
  assertPermission(actor.offices, "operation:edit");
  const parsed = parseFinancialAssessmentInput(
    typeof raw === "object" && raw !== null ? { ...(raw as object), operationId } : { operationId },
  );
  const current = deps.operations.findById(operationId);
  if (!current) throw new NotFoundError(`Operación con id ${operationId} no encontrada`);
  const assessment = {
    monthlySales: parsed.monthlySales,
    monthlyIncome: parsed.monthlyIncome,
    monthlyExpenses: parsed.monthlyExpenses,
    existingDebtPayment: parsed.existingDebtPayment,
    guaranteeValue: parsed.guaranteeValue,
    projectedRoiPercent: parsed.projectedRoiPercent,
  };
  const calcResult = calculateCreditMetrics({
    assessment,
    amount: current.requestedAmount,
    termMonths: current.termMonths,
    annualRatePercent: current.interestRate ?? DEFAULT_RATES_CONFIG.creditAnnualRatePercent,
    guarantorAssessment: current.guarantorAssessment,
  });
  const hardRuleHits = evaluateHardRules({
    assessment,
    calcResult,
    declaredPurpose: current.purpose,
  });
  const stored = deps.operations.save({
    ...current,
    assessment,
    calcResult,
    hardRuleHits,
    updatedAt: deps.now(),
  });
  writeAudit(deps, {
    entityType: "Operation",
    entityId: stored.id,
    field: "assessment.monthlyIncome",
    newValue: parsed.monthlyIncome,
    action: "assessment.record",
    byUserId: actor.userId,
  });
  return stored;
}

export function addGuarantor(
  deps: IntakeDeps,
  operationId: string,
  raw: unknown,
  actor: IntakeActor,
): Operation {
  assertPermission(actor.offices, "operation:edit");
  const parsed = parseGuarantorInput(
    typeof raw === "object" && raw !== null ? { ...(raw as object), operationId } : { operationId },
  );
  const current = deps.operations.findById(operationId);
  if (!current) throw new NotFoundError(`Operación con id ${operationId} no encontrada`);
  const checklist = mergeChecklistPreservingProgress(current.checklist, {
    productType: current.productType,
    guaranteeType: current.guaranteeType,
    hasGuarantor: true,
  });
  let next: Operation = {
    ...current,
    hasGuarantor: true,
    guarantor: {
      fullName: parsed.fullName,
      dpi: parsed.dpi,
      phone: parsed.phone,
      relationship: parsed.relationship,
    },
    guarantorAssessment: parsed.financialAssessment ?? current.guarantorAssessment,
    checklist,
    updatedAt: deps.now(),
  };
  if (next.assessment && parsed.financialAssessment) {
    const calcResult = calculateCreditMetrics({
      assessment: next.assessment,
      amount: next.requestedAmount,
      termMonths: next.termMonths,
      annualRatePercent: next.interestRate ?? DEFAULT_RATES_CONFIG.creditAnnualRatePercent,
      guarantorAssessment: parsed.financialAssessment,
    });
    next = {
      ...next,
      calcResult,
      hardRuleHits: evaluateHardRules({
        assessment: next.assessment,
        calcResult,
        declaredPurpose: next.purpose,
      }),
    };
  }
  const stored = deps.operations.save(next);
  writeAudit(deps, {
    entityType: "Operation",
    entityId: stored.id,
    field: "guarantor.dpi",
    newValue: stored.guarantor?.dpi ? maskDpi(stored.guarantor.dpi) : stored.guarantor?.fullName,
    action: "guarantor.add",
    byUserId: actor.userId,
  });
  return stored;
}

export function recordWatchlistCheck(
  deps: IntakeDeps,
  operationId: string,
  raw: unknown,
  actor: IntakeActor,
): Operation {
  assertPermission(actor.offices, "operation:edit");
  const parsed = parseWatchlistCheckInput(
    typeof raw === "object" && raw !== null ? { ...(raw as object), operationId } : { operationId },
  );
  const current = deps.operations.findById(operationId);
  if (!current) throw new NotFoundError(`Operación con id ${operationId} no encontrada`);
  const entry = {
    id: deps.newId(),
    operationId: toOperationId(operationId),
    source: parsed.source,
    queryRef: parsed.queryRef,
    result: parsed.result,
    checkedByUserId: parsed.checkedByUserId,
    checkedAt: deps.now(),
    notes: parsed.notes,
  };
  const stored = deps.operations.save({
    ...current,
    watchlistChecks: [...(current.watchlistChecks ?? []), entry],
    updatedAt: deps.now(),
  });
  writeAudit(deps, {
    entityType: "Operation",
    entityId: stored.id,
    field: `watchlist.${parsed.source}`,
    newValue: parsed.result,
    action: "watchlist.record",
    byUserId: actor.userId,
  });
  return stored;
}

export function caseAssemblyStatus(
  deps: IntakeDeps,
  operationId: string,
  actor: IntakeActor,
): CaseAssemblyStatusDto {
  assertPermission(actor.offices, "operation:read");
  const operation = deps.operations.findById(operationId);
  if (!operation) throw new NotFoundError(`Operación con id ${operationId} no encontrada`);
  const checklistComplete = isChecklistReadyForReview(operation.checklist);
  const pendingChecklistCount = operation.checklist.filter(
    (item) => item.required && item.status === "PENDING",
  ).length;
  const coverage = evaluateWatchlistCoverage(
    operation.watchlistChecks ?? [],
    requiredLists(deps),
  );
  const hasFinancialAssessment = operation.assessment !== undefined;
  return {
    operationId: operation.id,
    assembledByUserId: operation.assembledByUserId,
    assembledAt: operation.assembledAt,
    checklistComplete,
    pendingChecklistCount,
    hasFinancialAssessment,
    watchlistChecksCompleted: coverage.clear,
    watchlistGaps: coverage.gaps,
    readyForReview: checklistComplete && hasFinancialAssessment && coverage.clear,
  };
}

export function markAssembled(
  deps: IntakeDeps,
  operationId: string,
  actor: IntakeActor,
): Operation {
  assertPermission(actor.offices, "operation:edit");
  const current = deps.operations.findById(operationId);
  if (!current) throw new NotFoundError(`Operación con id ${operationId} no encontrada`);
  const stored = deps.operations.save({
    ...current,
    assembledByUserId: actor.userId,
    assembledAt: deps.now(),
    updatedAt: deps.now(),
  });
  writeAudit(deps, {
    entityType: "Operation",
    entityId: stored.id,
    field: "assembledByUserId",
    newValue: actor.userId,
    action: "operation.assemble",
    byUserId: actor.userId,
  });
  return stored;
}

export function readAudit(
  deps: IntakeDeps & { auditEntries: () => AuditEntry[] },
  actor: IntakeActor,
): AuditEntry[] {
  assertPermission(actor.offices, "audit-log:read");
  return deps.auditEntries();
}
