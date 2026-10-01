# Spec Delta

## ADDED Requirements

### Requirement: Unknown checklist code fails
The system SHALL reject a checklist update whose code is not on the operation checklist.

#### Scenario: Unknown code
- **WHEN** a checklist update uses a code that the operation does not have
- **THEN** the system returns a validation error and leaves the checklist unchanged

### Requirement: Guarantor refresh keeps progress
When a guarantor is added, the system SHALL rebuild the checklist for that product, guarantee, and guarantor flag, and SHALL keep the status of codes that already existed.

#### Scenario: Confirmed DPI survives
- **WHEN** the DPI item is confirmed and a guarantor is then added
- **THEN** the DPI item stays confirmed and the guarantor items appear as pending

## Tests

- `packages/domain/src/intake-rules.test.ts`
- `packages/application/src/intake-use-cases.test.ts`
- `apps/api/src/modules/operations/__tests__/update-checklist.service.spec.ts`
- `apps/api/src/modules/operations/__tests__/guarantor.service.spec.ts`
