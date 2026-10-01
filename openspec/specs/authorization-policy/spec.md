# Authorization policy

## Purpose

Quién autoriza un crédito según el monto, con política versionada en configuración: firma dual bajo el umbral y quórum del Consejo desde el umbral.

## Requirements

### Requirement: Configurable policy not two organs
The system SHALL evaluate credit authorization against a versioned `AuthorizationPolicy` in config (`authorization.policy`), not against hardcoded Gerencia vs Consejo routes. There is no `MANAGEMENT` office.

Default seed bands:
- Amount below `thresholdGTQ`: two signatures from distinct users, one `BRANCH_HEAD` and one `DELEGATED_AUTHORIZER`.
- Amount at or above `thresholdGTQ`: `quorumN` votes from distinct `COUNCIL_MEMBER` holders.

#### Scenario: Route follows the configured threshold
- **WHEN** an operation amount is below `thresholdGTQ`
- **THEN** the route is `BRANCH_DUAL_SIGNATURE` with one `BRANCH_HEAD` and one `DELEGATED_AUTHORIZER`
- **AND** an amount at or above the threshold resolves to `COUNCIL_QUORUM`

### Requirement: One person once
The system SHALL reject a second `Verdict` from the same `byUserId` on the same operation, even if the user holds another office.

#### Scenario: Same user votes twice
- **WHEN** a user who already cast a verdict on an operation casts another one with a different office
- **THEN** the domain rejects the second verdict

### Requirement: Originator cannot authorize as delegate or council
`createdBy` SHALL NOT exercise `DELEGATED_AUTHORIZER` or `COUNCIL_MEMBER` on that operation. `createdBy` MAY exercise `BRANCH_HEAD`.

#### Scenario: Originator tries to sign as delegate
- **WHEN** the user in `createdBy` casts a verdict exercising `DELEGATED_AUTHORIZER` or `COUNCIL_MEMBER`
- **THEN** the domain rejects the verdict
- **AND** the same user exercising `BRANCH_HEAD` is accepted

### Requirement: Verdict records exercised office
Every `Verdict` SHALL persist `officeCode`. Minutes SHALL name the person "en calidad de {office label}".

#### Scenario: Office appears in the minutes
- **WHEN** a verdict is cast by a user holding several offices
- **THEN** the verdict stores the `officeCode` actually exercised
- **AND** the minutes read "en calidad de" that office label

### Requirement: Consult is not operate
`COUNCIL_MEMBER` SHALL NOT receive capture or edit permissions. The authorization inbox SHALL list only operations the current user's offices still need to sign or vote.

#### Scenario: Council member opens the inbox
- **WHEN** a `COUNCIL_MEMBER` without capture offices lists the authorization inbox
- **THEN** only operations still needing their vote are listed
- **AND** capture and edit actions are not available

### Requirement: Approve with changes
`APPROVE_WITH_CHANGES` SHALL require `modifiedAmount` or `modifiedTermMonths` and SHALL force a `CalcResult` recompute.

#### Scenario: Approve with changes without a change
- **WHEN** a verdict `APPROVE_WITH_CHANGES` has neither `modifiedAmount` nor `modifiedTermMonths`
- **THEN** the domain rejects it
- **AND** with a modification the `CalcResult` is recomputed

## Tests

- `packages/domain/src/verdict-policy.test.ts`
- `POST /approvals/resolve` (API adapter)
