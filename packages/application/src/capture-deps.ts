import {
  maskDpi,
  type CaptureAuditAction,
  type OperationListItem,
  type PersonListItem,
  type UserId,
} from "@crece/shared";
import {
  recordSensitiveChange,
  type AuditLog,
  type ConfigRepository,
  type Operation,
  type OperationRepository,
  type Person,
  type PersonRepository,
} from "@crece/domain";

/** Puertos que usan los casos de uso de captación (fases 1–3). Los adaptadores viven en apps/api. */
export type CaptureDeps = {
  persons: PersonRepository;
  operations: OperationRepository;
  audit: AuditLog;
  config: Pick<ConfigRepository, "get" | "getRatesConfig">;
  now: () => string;
  newId: () => string;
};

export function toPersonListItem(person: Person, operationsCount: number): PersonListItem {
  return {
    id: person.id,
    fullName: person.fullName,
    dpiMasked: person.dpi ? maskDpi(person.dpi) : undefined,
    phone: person.contacts.phone,
    status: person.status,
    source: person.source,
    interest: person.interest,
    createdAt: person.createdAt,
    operationsCount,
  };
}

export function toOperationListItem(operation: Operation): OperationListItem {
  return {
    id: operation.id,
    personId: operation.personId,
    productType: operation.productType,
    guaranteeType: operation.guaranteeType,
    requestedAmount: operation.requestedAmount,
    termMonths: operation.termMonths,
    purpose: operation.purpose,
    state: operation.state,
    hasGuarantor: operation.hasGuarantor,
    createdAt: operation.createdAt,
    updatedAt: operation.updatedAt,
  };
}

export type AuditInput = {
  entityType: "Person" | "Operation";
  entityId: string;
  action: CaptureAuditAction;
  byUserId: UserId;
  field?: string;
  oldValue?: string | number | null;
  newValue?: string | number | null;
};

export function appendAudit(deps: CaptureDeps, input: AuditInput) {
  return deps.audit.append(recordSensitiveChange({ ...input, field: input.field ?? "-" }));
}
