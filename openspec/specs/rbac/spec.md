# RBAC — Usuario, cargo, permiso

## Purpose

Usuarios con uno o más cargos y permisos que se suman; consultar no es operar.

## Requirements

### Requirement: Offices not collapsed permissions
A user SHALL hold one or more `Office` values. Permissions are the union of those offices. The catalog is: `ADVISOR`, `BRANCH_HEAD`, `DELEGATED_AUTHORIZER`, `COUNCIL_MEMBER`, `ADMIN_ASSISTANT`, `OVERSIGHT`, `SYSTEM_ADMIN`. There is no `MANAGEMENT` / Gerencia office.

#### Scenario: Two offices
- **WHEN** a user holds `BRANCH_HEAD` and `ADVISOR`
- **THEN** their permissions are the union of both offices

### Requirement: Consult vs operate
`COUNCIL_MEMBER` and `DELEGATED_AUTHORIZER` SHALL NOT receive `operation:create`, `operation:edit`, or `person:create`. They MAY read cases in their authorization queue and pipeline aggregates.

#### Scenario: Delegate tries to capture
- **WHEN** a `DELEGATED_AUTHORIZER` requests `operation:create` or `person:create`
- **THEN** the permission check denies it

### Requirement: Council mobile vote view
Users exercising `COUNCIL_MEMBER` on operations in the quorum band SHALL see a mobile-optimized vote layout with one-page summary and sticky verdict actions in Spanish.

#### Scenario: Vote on a phone
- **WHEN** a `COUNCIL_MEMBER` opens a quorum-band operation on a phone
- **THEN** a one-page summary with sticky verdict actions in Spanish is shown

### Requirement: Assign offices in G-01
`SYSTEM_ADMIN` SHALL assign offices (not a single "role") to users. Changes SHALL write `AuditEntry`.

#### Scenario: Offices assigned
- **WHEN** a `SYSTEM_ADMIN` assigns offices to a user
- **THEN** the change is stored and an `AuditEntry` is written

## Tests

- `packages/application/src/rbac.test.ts`
