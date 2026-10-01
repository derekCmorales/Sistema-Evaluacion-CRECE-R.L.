# Spec Delta

## ADDED Requirements

### Requirement: Single person repository
The system SHALL store landing prospects and advisor registrations in the same person repository. Completing a prospect with a DPI SHALL update that person and SHALL NOT create a second person.

#### Scenario: Landing prospect is completed with a DPI
- **WHEN** a landing prospect exists without a DPI and an advisor registers the same phone with a 13-digit DPI
- **THEN** the stored person count for that identity stays one and the DPI is saved on the original person

### Requirement: Every person is born a prospect
The system SHALL create every newly registered person in `PROSPECT` status, including a person registered by an advisor.

#### Scenario: Advisor registration
- **WHEN** an advisor registers a person with a valid DPI
- **THEN** the person status is `PROSPECT`

### Requirement: Draft requires an existing person with DPI
The system SHALL refuse to open a draft operation when the person does not exist or does not have a 13-digit DPI.

#### Scenario: Missing person
- **WHEN** a draft is requested for an unknown person id
- **THEN** the system rejects the draft and does not create an operation

#### Scenario: Person without DPI
- **WHEN** a draft is requested for a prospect that has no DPI
- **THEN** the system rejects the draft

### Requirement: Non-numeric amounts are rejected
The system SHALL reject a financial amount that is present and not numeric. It SHALL NOT drop that value and continue.

#### Scenario: Guarantee value is text
- **WHEN** an assessment is saved with a non-numeric guarantee value
- **THEN** the system returns a validation error and does not store the assessment

### Requirement: Guarantor DPI is normalized
The system SHALL store a guarantor DPI as exactly 13 digits when one is provided, and SHALL reject any other shape.

#### Scenario: Spaced DPI
- **WHEN** a guarantor DPI is submitted with spaces
- **THEN** the stored DPI has 13 digits and no separators

### Requirement: Watchlist gaps stay visible
The system SHALL read required watchlist sources from configuration. A `MATCH_FOUND` or `PENDING_MANUAL_REVIEW` result on a required source SHALL leave a visible gap and SHALL keep the case from being ready for review.

#### Scenario: Manual review
- **WHEN** every required source has a check and one result is `PENDING_MANUAL_REVIEW`
- **THEN** assembly status reports that gap and `readyForReview` is false

### Requirement: Masked DPI outside URLs
Person listings SHALL show a masked DPI. The system SHALL NOT place the DPI in a URL.

#### Scenario: Directory listing
- **WHEN** a reader lists persons
- **THEN** each DPI is masked and the row is addressed by person id

## Tests

- `packages/domain/src/intake-rules.test.ts`
- `packages/application/src/intake-use-cases.test.ts`
- `packages/application/src/case-assembly-contracts.test.ts`
- `apps/api/src/modules/persons/persons.flow.spec.ts`
