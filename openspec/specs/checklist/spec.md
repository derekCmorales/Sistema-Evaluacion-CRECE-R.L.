# Checklist

## Purpose

Requisitos documentales que dependen de producto, garantía y fiador, con faltantes visibles y razones para lo que no aplica.

## Requirements

### Requirement: Dynamic checklist
Checklist items SHALL resolve from product type, guarantee type, and guarantor flag (`createChecklistItems` in `@crece/domain`). Production templates SHALL live in versioned `ChecklistTemplate` rows.

#### Scenario: Guarantor adds requirements
- **WHEN** an operation has a guarantor
- **THEN** the checklist includes the guarantor requirements resolved by `createChecklistItems`

### Requirement: Visual statuses
Each checklist item SHALL display one of: Pendiente, Cargado, Confirmado, No aplica (with reason), Faltante visible.

#### Scenario: Item status shown
- **WHEN** a checklist item is displayed
- **THEN** it shows exactly one of Pendiente, Cargado, Confirmado, No aplica or Faltante visible

### Requirement: Missing visible tolerance
Advisors MAY mark required items as missing visible to advance with visible gaps. Not applicable SHALL require a non-empty reason. Expired documents SHALL warn, not block (`resolveDocumentValidity`).

#### Scenario: Not applicable without a reason
- **WHEN** an advisor marks an item as not applicable with an empty reason
- **THEN** the change is rejected
- **AND** an expired document only warns

### Requirement: Item updates are explicit
Updating a checklist item SHALL fail with a validation error when the code is not part of the operation's checklist; it SHALL NOT report success without changes. Marking `NOT_APPLICABLE` SHALL require a reason of at least 5 characters, and leaving `NOT_APPLICABLE` SHALL clear the reason. Each change SHALL be appended to the audit log with old and new status.

#### Scenario: Unknown code
- **WHEN** `PATCH /operations/:id/checklist` sends code `NO_EXISTE`
- **THEN** it returns 400 and the operation is unchanged

### Requirement: Checklist regeneration keeps progress
When the guarantor flag turns on, the checklist SHALL add the guarantor items (DPI, income, bureau) as pending and SHALL keep the status, reason and document of items that still apply.

#### Scenario: Guarantor added after progress
- **WHEN** DPI is confirmed and then a guarantor is added
- **THEN** DPI stays confirmed and `GUARANTOR_BUREAU` appears pending

## Tests

- `packages/domain/src/checklist-resolver.test.ts`
- `packages/domain/src/document-validity.test.ts`
- `GET /operations/checklist`
