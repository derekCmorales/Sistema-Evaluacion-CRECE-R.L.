# RBAC — Usuario, cargo, permiso

## Requirements

### Requirement: Offices not collapsed permissions
A user SHALL hold one or more `Office` values. Permissions are the union of those offices. The catalog is: `ADVISOR`, `BRANCH_HEAD`, `DELEGATED_AUTHORIZER`, `COUNCIL_MEMBER`, `ADMIN_ASSISTANT`, `OVERSIGHT`, `SYSTEM_ADMIN`. There is no `MANAGEMENT` / Gerencia office.

### Requirement: Consult vs operate
`COUNCIL_MEMBER` and `DELEGATED_AUTHORIZER` SHALL NOT receive `operation:create`, `operation:edit`, or `person:create`. They MAY read cases in their authorization queue and pipeline aggregates.

### Requirement: Council mobile vote view
Users exercising `COUNCIL_MEMBER` on operations in the quorum band SHALL see a mobile-optimized vote layout with one-page summary and sticky verdict actions in Spanish.

### Requirement: Assign offices in G-01
`SYSTEM_ADMIN` SHALL assign offices (not a single "role") to users. Changes SHALL write `AuditEntry`.

## Tests

- `packages/application/src/rbac.test.ts`
