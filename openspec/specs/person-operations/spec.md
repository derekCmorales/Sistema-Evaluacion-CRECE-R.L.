# Person & Operations

## Purpose

Persona como centro del modelo y ciclo de vida de sus operaciones de crédito: prospecto distinto de operación y transiciones de estado que fallan en dominio.

## Requirements

### Requirement: Person aggregate
The system SHALL keep one identity per person across channels and operations. `POST /public/prospects` and agency registration SHALL write to the same `PersonRepository`. Every person SHALL be created in `PROSPECT` status, whether it comes from the landing or is registered by an advisor, and registration SHALL NOT create an `Operation`.

#### Scenario: Landing prospect
- **WHEN** `POST /public/prospects` receives a valid form
- **THEN** only a `Person` in `PROSPECT` status is created
- **AND** no `Operation` is created

#### Scenario: Advisor registration
- **WHEN** an advisor registers Don Marco with his DPI
- **THEN** a `Person` in `PROSPECT` status exists with source `ADVISOR` and `registeredByUserId` set to the advisor, and no `Operation` exists

#### Scenario: Landing prospect in the directory
- **WHEN** a prospect arrives through `POST /public/prospects`
- **THEN** it appears in `GET /persons` with source `LANDING`

### Requirement: Operation lifecycle
Operation states SHALL follow: Draft → ReadyForReview → UnderReview → Approved/Rejected/ReturnedToAdvisor → Packaged. Illegal transitions SHALL fail in `@crece/domain` (`assertTransition`).

#### Scenario: Illegal transition
- **WHEN** code requests a transition not allowed by the state machine
- **THEN** `assertTransition` fails in `@crece/domain`

### Requirement: Operation workspace by stage
The operation screen SHALL present Captura → Revisión → Decisión → Cierre. Council vote mode for amounts at or above threshold remains a compact mobile view.

#### Scenario: Workspace stages
- **WHEN** a user opens an operation
- **THEN** the screen presents Captura, Revisión, Decisión and Cierre

### Requirement: Role work queues
The dashboard SHALL show role-relevant queues (advisor drafts/returns, jefatura below threshold, council at or above threshold, assistant approved) instead of only aggregate counters.

#### Scenario: Council dashboard
- **WHEN** a `COUNCIL_MEMBER` opens the dashboard
- **THEN** it shows the operations at or above the threshold awaiting their vote

### Requirement: Guarantor assessment
When `hasGuarantor` is true the operation SHALL capture a separate financial assessment and bureau document for the guarantor.

#### Scenario: Guarantor flagged
- **WHEN** `hasGuarantor` is true
- **THEN** a separate guarantor assessment and bureau document are required

### Requirement: DPI-based identity
A person's DPI SHALL be 13 digits, normalized from spaces and hyphens. Registering a DPI that already belongs to a person SHALL fail with `DUPLICATE_PERSON` and return the existing person id. A landing prospect without DPI SHALL be completed with its DPI instead of being registered again; a DPI already assigned SHALL NOT be replaced. Listings SHALL show the DPI masked and lookups SHALL carry the DPI in the request body, never in the URL.

#### Scenario: Same DPI, different format
- **WHEN** `2345 67890 0101` is registered and later `2345-67890-0101`
- **THEN** the second request returns 409 with `existingPersonId`

### Requirement: Draft operation on an existing person
A credit application SHALL be opened in `DRAFT` only for an existing person that has a DPI, with product, guarantee, amount, term, purpose and guarantor flag, and with the checklist resolved by `createChecklistItems`. The user who opens it SHALL come from the session.

#### Scenario: Orphan draft
- **WHEN** `POST /operations` references a person that does not exist
- **THEN** it returns 404 and no operation is created

### Requirement: Capture is role-gated
Registering persons and opening or editing operations SHALL require the corresponding permission; consulting roles (Council, oversight) SHALL read but not capture.

#### Scenario: Council member
- **WHEN** a `COUNCIL_MEMBER` tries to register a person
- **THEN** the request fails with 403 and the directory remains readable

## Tests

- `packages/domain/src/operation-state-machine.test.ts`
- `packages/application/src/public-prospect.test.ts`
