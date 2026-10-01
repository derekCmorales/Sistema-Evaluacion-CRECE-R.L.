# Audit log

## Purpose

Bitácora append-only con valor anterior y nuevo para todo cambio sensible.

## Requirements

### Requirement: Sensitive change delta
The system SHALL persist `AuditEntry` records with `entityType`, `entityId`, `field`, `oldValue`, `newValue`, `action`, `byUserId`, and `at` for sensitive mutations (amounts, assessment, term, config, offices, rates, templates).

#### Scenario: Amount changes
- **WHEN** the requested amount of an operation changes
- **THEN** an `AuditEntry` stores the old and new values, the action, the user and the time

### Requirement: Consultable audit trail
`OVERSIGHT` SHALL query audit entries filtered by entity, field, user, and date range without mutating history.

#### Scenario: Oversight filters the trail
- **WHEN** an `OVERSIGHT` user queries by entity, field, user or dates
- **THEN** matching entries are returned
- **AND** no entry can be modified or deleted

### Requirement: Correlation support
Audit entries MAY include `correlationId` to group related changes within a single request or workflow step.

#### Scenario: Related changes share a correlation
- **WHEN** one request changes several sensitive fields
- **THEN** the entries MAY share the same `correlationId`

## Tests

- `packages/domain/src/audit-log.ts` (`recordSensitiveChange`)
- Prisma model `AuditEntry` in `apps/api/prisma/schema.prisma`
