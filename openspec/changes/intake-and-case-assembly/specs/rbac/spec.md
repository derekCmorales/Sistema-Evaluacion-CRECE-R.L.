# Spec Delta

## ADDED Requirements

### Requirement: Intake use cases check office
Each captación and case-assembly use case SHALL check the actor's offices before mutating or listing. `COUNCIL_MEMBER` SHALL NOT create persons, open drafts, or edit an operation.

#### Scenario: Council cannot register
- **WHEN** a council member submits a person registration
- **THEN** the system rejects the action as forbidden

#### Scenario: Council can read the file
- **WHEN** a council member opens an existing operation
- **THEN** the system returns the file and does not allow edits

## Tests

- `packages/application/src/intake-use-cases.test.ts`
- `packages/application/src/rbac.test.ts`
