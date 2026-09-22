# Audit log

## Requirements

### Requirement: Sensitive change delta
The system SHALL persist `AuditEntry` records with `entityType`, `entityId`, `field`, `oldValue`, `newValue`, `action`, `byUserId`, and `at` for sensitive mutations (amounts, assessment, term, config, offices, rates, templates).

### Requirement: Consultable audit trail
`OVERSIGHT` SHALL query audit entries filtered by entity, field, user, and date range without mutating history.

### Requirement: Correlation support
Audit entries MAY include `correlationId` to group related changes within a single request or workflow step.

## Tests

- `packages/domain/src/audit-log.ts` (`recordSensitiveChange`)
- Prisma model `AuditEntry` in `apps/api/prisma/schema.prisma`
