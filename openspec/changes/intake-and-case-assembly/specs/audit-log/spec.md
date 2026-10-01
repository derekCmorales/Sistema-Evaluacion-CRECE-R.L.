# Spec Delta

## ADDED Requirements

### Requirement: Intake steps are audited
The system SHALL append an audit entry for each captación or case-assembly mutation, including prospect capture, person registration or completion, draft opening, checklist update, assessment, guarantor, watchlist check, and assemble.

#### Scenario: Register then open a draft
- **WHEN** an advisor registers a person and opens a draft
- **THEN** the audit trail contains both actions with the acting user

## Tests

- `packages/application/src/intake-use-cases.test.ts`
- `apps/api/src/modules/persons/persons.flow.spec.ts`
