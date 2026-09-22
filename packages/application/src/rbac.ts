import type { Office } from "@crece/shared";

/**
 * Matriz deny-by-default. Consultar ≠ operar.
 * COUNCIL_MEMBER y DELEGATED_AUTHORIZER no originan ni editan.
 */
export const PERMISSIONS: Record<string, Office[]> = {
  "person:create": ["ADVISOR", "BRANCH_HEAD"],
  "person:read": [
    "ADVISOR",
    "BRANCH_HEAD",
    "ADMIN_ASSISTANT",
    "DELEGATED_AUTHORIZER",
    "COUNCIL_MEMBER",
    "OVERSIGHT",
    "SYSTEM_ADMIN",
  ],
  "operation:create": ["ADVISOR", "BRANCH_HEAD"],
  "operation:edit": ["ADVISOR", "BRANCH_HEAD"],
  "operation:submit": ["ADVISOR", "BRANCH_HEAD"],
  "operation:verdict": ["DELEGATED_AUTHORIZER", "BRANCH_HEAD", "COUNCIL_MEMBER"],
  "operation:sign-below": ["BRANCH_HEAD", "DELEGATED_AUTHORIZER"],
  "operation:vote-council": ["COUNCIL_MEMBER"],
  "operation:consult": [
    "DELEGATED_AUTHORIZER",
    "COUNCIL_MEMBER",
    "OVERSIGHT",
    "BRANCH_HEAD",
  ],
  "operation:read": [
    "ADVISOR",
    "BRANCH_HEAD",
    "ADMIN_ASSISTANT",
    "DELEGATED_AUTHORIZER",
    "COUNCIL_MEMBER",
    "OVERSIGHT",
    "SYSTEM_ADMIN",
  ],
  "decision-log:read": [
    "BRANCH_HEAD",
    "DELEGATED_AUTHORIZER",
    "COUNCIL_MEMBER",
    "OVERSIGHT",
  ],
  "package:generate": ["ADMIN_ASSISTANT"],
  "prospect:read": ["ADVISOR", "BRANCH_HEAD"],
  "prospect:convert": ["ADVISOR", "BRANCH_HEAD"],
  "pipeline:read": [
    "DELEGATED_AUTHORIZER",
    "BRANCH_HEAD",
    "COUNCIL_MEMBER",
    "OVERSIGHT",
  ],
  "audit-log:read": ["OVERSIGHT", "SYSTEM_ADMIN"],
  "documents:generate": ["ADMIN_ASSISTANT", "ADVISOR", "BRANCH_HEAD"],
  "admin:users": ["SYSTEM_ADMIN"],
  "admin:checklist": ["SYSTEM_ADMIN"],
  "admin:rules": ["SYSTEM_ADMIN"],
  "admin:authorization": ["SYSTEM_ADMIN"],
  "admin:factors": ["SYSTEM_ADMIN"],
  "admin:templates": ["SYSTEM_ADMIN"],
  "admin:rates": ["SYSTEM_ADMIN"],
};

export function hasPermission(userOffices: Office[], permission: string): boolean {
  const allowed = PERMISSIONS[permission];
  if (!allowed) return false;
  return userOffices.some((office) => allowed.includes(office));
}

export function getPermissionsForOffices(offices: Office[]): string[] {
  return Object.entries(PERMISSIONS)
    .filter(([, allowed]) => offices.some((o) => allowed.includes(o)))
    .map(([permission]) => permission);
}
