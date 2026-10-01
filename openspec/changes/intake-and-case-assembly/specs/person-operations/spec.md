# Person & Operations (Delta)

## MODIFIED Requirements

### Requirement: Person aggregate
The system SHALL keep one identity per person across channels and operations. `POST /public/prospects` and agency registration SHALL write to the same `PersonRepository`. Every person SHALL be created in `PROSPECT` status, whether it comes from the landing or is registered by an advisor, and registration SHALL NOT create an `Operation`.

#### Scenario: Advisor registration
- **WHEN** an advisor registers Don Marco with his DPI
- **THEN** a `Person` in `PROSPECT` status exists with source `ADVISOR` and `registeredByUserId` set to the advisor, and no `Operation` exists

#### Scenario: Landing prospect in the directory
- **WHEN** a prospect arrives through `POST /public/prospects`
- **THEN** it appears in `GET /persons` with source `LANDING`

## ADDED Requirements

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

- `packages/domain/src/person-identity.test.ts`
- `packages/application/src/person-intake.test.ts`
- `packages/application/src/case-file.test.ts` (apertura en borrador)
- `apps/api/src/modules/capture/capture.http.test.ts`
