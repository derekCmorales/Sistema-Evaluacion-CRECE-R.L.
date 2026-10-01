# Checklist (Delta)

## ADDED Requirements

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

- `packages/domain/src/case-assembly.test.ts`
- `packages/application/src/case-file.test.ts`
