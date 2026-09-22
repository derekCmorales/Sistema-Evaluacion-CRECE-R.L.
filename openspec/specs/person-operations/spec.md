# Person & Operations

## Requirements

### Requirement: Person aggregate
The system SHALL register persons/prospects without duplicating identity across operations. `POST /public/prospects` SHALL create only a `Person` in `PROSPECT` status and SHALL NOT create an `Operation`.

### Requirement: Operation lifecycle
Operation states SHALL follow: Draft → ReadyForReview → UnderReview → Approved/Rejected/ReturnedToAdvisor → Packaged. Illegal transitions SHALL fail in `@crece/domain` (`assertTransition`).

### Requirement: Operation workspace by stage
The operation screen SHALL present Captura → Revisión → Decisión → Cierre. Council vote mode for amounts at or above threshold remains a compact mobile view.

### Requirement: Role work queues
The dashboard SHALL show role-relevant queues (advisor drafts/returns, jefatura below threshold, council at or above threshold, assistant approved) instead of only aggregate counters.

### Requirement: Guarantor assessment
When `hasGuarantor` is true the operation SHALL capture a separate financial assessment and bureau document for the guarantor.

## Tests

- `packages/domain/src/operation-state-machine.test.ts`
- `packages/application/src/public-prospect.test.ts`
