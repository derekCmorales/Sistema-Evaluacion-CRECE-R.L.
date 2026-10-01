import {
  CASE_ASSEMBLY_CONFIG_KEYS,
  InvariantViolationError,
  NotFoundError,
  WATCHLIST_SOURCES_SEED,
  toOperationId,
  type Actor,
  type OperationListItem,
  type WatchlistSource,
} from "@crece/shared";
import {
  applyChecklistUpdate,
  applyGuarantor,
  assertCaseEditable,
  calculateCreditMetrics,
  clearAssembly,
  createChecklistItems,
  evaluateCaseAssembly,
  evaluateHardRules,
  markAssembled,
  type AuditEntry,
  type CaseAssemblyStatus,
  type Operation,
} from "@crece/domain";
import { assertPermission } from "./actor";
import { appendAudit, toOperationListItem, type CaptureDeps } from "./capture-deps";
import {
  parseChecklistItemUpdate,
  parseFinancialAssessment,
  parseGuarantor,
  parseWatchlistCheck,
} from "./case-assembly-contracts";
import { parseOpenDraftOperation } from "./operation-contracts";
import { requirePerson } from "./person-intake";

/**
 * Fases 2 y 3 — apertura de la solicitud y armado del expediente.
 * Captura manual; cálculo determinístico del motor. Ningún paso puntúa ni recomienda.
 */

export type CaseFile = {
  operation: Operation;
  assembly: CaseAssemblyStatus;
};

/** Fase 2: abre la solicitud en borrador sobre una persona que ya existe y tiene DPI. */
export async function openDraftOperation(deps: CaptureDeps, actor: Actor, body: unknown): Promise<CaseFile> {
  assertPermission(actor, "operation:create");
  const input = parseOpenDraftOperation(body);
  const person = await requirePerson(deps, input.personId);
  if (!person.dpi) {
    throw new InvariantViolationError("Completa el DPI del solicitante antes de abrir una solicitud");
  }
  const operation = await deps.operations.create({
    personId: person.id,
    productType: input.productType,
    guaranteeType: input.guaranteeType,
    hasGuarantor: input.hasGuarantor,
    requestedAmount: input.requestedAmount,
    termMonths: input.termMonths,
    purpose: input.purpose,
    state: "DRAFT",
    checklist: createChecklistItems(input),
    hardRuleHits: [],
    verdicts: [],
    watchlistChecks: [],
    createdBy: actor.userId,
  });
  await appendAudit(deps, {
    entityType: "Operation",
    entityId: operation.id,
    action: "OPERATION_OPENED",
    byUserId: actor.userId,
    field: "requestedAmount",
    newValue: operation.requestedAmount.amount,
  });
  return withAssembly(deps, operation);
}

export type CaseFileListItem = OperationListItem & {
  personName: string;
  readyForReview: boolean;
  gapsCount: number;
};

/** Cola de expedientes (más reciente primero) con su avance de armado. */
export async function listCaseFiles(deps: CaptureDeps, actor: Actor): Promise<CaseFileListItem[]> {
  assertPermission(actor, "operation:read");
  const [operations, persons, sources] = await Promise.all([
    deps.operations.findAll(),
    deps.persons.findAll(),
    watchlistSources(deps),
  ]);
  const names = new Map(persons.map((p) => [p.id, p.fullName]));
  return operations
    .map((operation) => {
      const assembly = evaluateCaseAssembly(operation, sources);
      return {
        ...toOperationListItem(operation),
        personName: names.get(operation.personId) ?? "—",
        readyForReview: assembly.readyForReview,
        gapsCount: assembly.gaps.length,
      };
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getCaseFile(deps: CaptureDeps, actor: Actor, operationId: string): Promise<CaseFile> {
  assertPermission(actor, "operation:read");
  return withAssembly(deps, await requireOperation(deps, operationId));
}

export async function updateChecklistItem(
  deps: CaptureDeps,
  actor: Actor,
  operationId: string,
  body: unknown,
): Promise<CaseFile> {
  const operation = await editableOperation(deps, actor, operationId);
  const update = parseChecklistItemUpdate(body);
  const previous = operation.checklist.find((item) => item.code === update.code);
  const saved = await save(deps, { ...operation, checklist: applyChecklistUpdate(operation.checklist, update) });
  await appendAudit(deps, {
    entityType: "Operation",
    entityId: operation.id,
    action: "CHECKLIST_ITEM_UPDATED",
    byUserId: actor.userId,
    field: update.code,
    oldValue: previous?.status,
    newValue: update.status,
  });
  return withAssembly(deps, saved);
}

/** Evaluación capturada a mano; el motor calcula y las reglas duras avisan o bloquean. */
export async function recordFinancialAssessment(
  deps: CaptureDeps,
  actor: Actor,
  operationId: string,
  body: unknown,
): Promise<CaseFile> {
  const operation = await editableOperation(deps, actor, operationId);
  const assessment = parseFinancialAssessment(body);
  const saved = await save(deps, await recalculate(deps, { ...operation, assessment }));
  await appendAudit(deps, {
    entityType: "Operation",
    entityId: operation.id,
    action: "ASSESSMENT_RECORDED",
    byUserId: actor.userId,
    field: "inputsHash",
    oldValue: operation.calcResult?.inputsHash,
    newValue: saved.calcResult?.inputsHash,
  });
  return withAssembly(deps, saved);
}

export async function setGuarantor(
  deps: CaptureDeps,
  actor: Actor,
  operationId: string,
  body: unknown,
): Promise<CaseFile> {
  const operation = await editableOperation(deps, actor, operationId);
  const withGuarantor = applyGuarantor(operation, parseGuarantor(body));
  const saved = await save(deps, await recalculate(deps, withGuarantor));
  await appendAudit(deps, {
    entityType: "Operation",
    entityId: operation.id,
    action: "GUARANTOR_SET",
    byUserId: actor.userId,
    field: "hasGuarantor",
    oldValue: String(operation.hasGuarantor),
    newValue: String(saved.hasGuarantor),
  });
  return withAssembly(deps, saved);
}

/** Registro manual de la consulta: el sistema no consulta las listas por sí mismo. */
export async function recordWatchlistCheck(
  deps: CaptureDeps,
  actor: Actor,
  operationId: string,
  body: unknown,
): Promise<CaseFile> {
  const operation = await editableOperation(deps, actor, operationId);
  const input = parseWatchlistCheck(body);
  const check = { id: deps.newId(), ...input, checkedByUserId: actor.userId, checkedAt: deps.now() };
  const saved = await save(deps, { ...operation, watchlistChecks: [...(operation.watchlistChecks ?? []), check] });
  await appendAudit(deps, {
    entityType: "Operation",
    entityId: operation.id,
    action: "WATCHLIST_CHECKED",
    byUserId: actor.userId,
    field: input.source,
    newValue: input.result,
  });
  return withAssembly(deps, saved);
}

/** Constancia de quién armó el expediente; solo con el expediente sin huecos. */
export async function markCaseAssembled(deps: CaptureDeps, actor: Actor, operationId: string): Promise<CaseFile> {
  const operation = await editableOperation(deps, actor, operationId);
  const marked = markAssembled(operation, await watchlistSources(deps), actor.userId, deps.now());
  const saved = await deps.operations.update({ ...marked, updatedAt: deps.now() });
  await appendAudit(deps, {
    entityType: "Operation",
    entityId: operation.id,
    action: "CASE_ASSEMBLED",
    byUserId: actor.userId,
  });
  return withAssembly(deps, saved);
}

export async function getOperationHistory(
  deps: CaptureDeps,
  actor: Actor,
  operationId: string,
): Promise<AuditEntry[]> {
  assertPermission(actor, "operation:read");
  const operation = await requireOperation(deps, operationId);
  return deps.audit.findByEntity("Operation", operation.id);
}

async function requireOperation(deps: CaptureDeps, operationId: string): Promise<Operation> {
  const operation = await deps.operations.findById(toOperationId(operationId));
  if (!operation) {
    throw new NotFoundError("No encontramos esa solicitud");
  }
  return operation;
}

async function editableOperation(deps: CaptureDeps, actor: Actor, operationId: string): Promise<Operation> {
  assertPermission(actor, "operation:edit");
  const operation = await requireOperation(deps, operationId);
  assertCaseEditable(operation);
  return operation;
}

/** Todo cambio del expediente invalida la constancia de armado. */
function save(deps: CaptureDeps, operation: Operation): Promise<Operation> {
  return deps.operations.update({ ...clearAssembly(operation), updatedAt: deps.now() });
}

async function recalculate(deps: CaptureDeps, operation: Operation): Promise<Operation> {
  if (!operation.assessment) return operation;
  const rates = await deps.config.getRatesConfig();
  const calcResult = calculateCreditMetrics({
    assessment: operation.assessment,
    amount: operation.requestedAmount,
    termMonths: operation.termMonths,
    annualRatePercent: operation.interestRate ?? rates.creditAnnualRatePercent,
    guarantorAssessment: operation.guarantorAssessment,
  });
  const hardRuleHits = evaluateHardRules({
    assessment: operation.assessment,
    calcResult,
    declaredPurpose: operation.purpose,
  });
  return { ...operation, calcResult, hardRuleHits };
}

function watchlistSources(deps: CaptureDeps): Promise<WatchlistSource[]> {
  return deps.config.get(CASE_ASSEMBLY_CONFIG_KEYS.watchlistSources, WATCHLIST_SOURCES_SEED);
}

async function withAssembly(deps: CaptureDeps, operation: Operation): Promise<CaseFile> {
  return { operation, assembly: evaluateCaseAssembly(operation, await watchlistSources(deps)) };
}
