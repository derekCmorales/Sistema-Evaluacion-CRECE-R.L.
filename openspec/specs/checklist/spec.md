# Checklist

## Requirements

### Requirement: Dynamic checklist
Checklist items SHALL resolve from product type, guarantee type, and guarantor flag (`createChecklistItems` in `@crece/domain`). Production templates SHALL live in versioned `ChecklistTemplate` rows.

### Requirement: Visual statuses
Each checklist item SHALL display one of: Pendiente, Cargado, Confirmado, No aplica (with reason), Faltante visible.

### Requirement: Missing visible tolerance
Advisors MAY mark required items as missing visible to advance with visible gaps. Not applicable SHALL require a non-empty reason. Expired documents SHALL warn, not block (`resolveDocumentValidity`).

## Tests

- `packages/domain/src/checklist-resolver.test.ts`
- `packages/domain/src/document-validity.test.ts`
- `GET /operations/checklist`
