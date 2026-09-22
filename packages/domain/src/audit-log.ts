import type { UserId } from "@crece/shared";

export type AuditEntry = {
  id: string;
  entityType: string;
  entityId: string;
  field: string;
  oldValue?: string;
  newValue?: string;
  action: string;
  byUserId: UserId;
  at: string;
  correlationId?: string;
};

export type SensitiveChangeInput = {
  entityType: string;
  entityId: string;
  field: string;
  oldValue?: string | number | null;
  newValue?: string | number | null;
  action: string;
  byUserId: UserId;
  correlationId?: string;
};

export function recordSensitiveChange(
  input: SensitiveChangeInput,
): Omit<AuditEntry, "id" | "at"> {
  return {
    entityType: input.entityType,
    entityId: input.entityId,
    field: input.field,
    oldValue: input.oldValue != null ? String(input.oldValue) : undefined,
    newValue: input.newValue != null ? String(input.newValue) : undefined,
    action: input.action,
    byUserId: input.byUserId,
    correlationId: input.correlationId,
  };
}
