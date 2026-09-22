# Authorization policy

## Requirements

### Requirement: Configurable policy not two organs
The system SHALL evaluate credit authorization against a versioned `AuthorizationPolicy` in config (`authorization.policy`), not against hardcoded Gerencia vs Consejo routes. There is no `MANAGEMENT` office.

Default seed bands:
- Amount below `thresholdGTQ`: two signatures from distinct users, one `BRANCH_HEAD` and one `DELEGATED_AUTHORIZER`.
- Amount at or above `thresholdGTQ`: `quorumN` votes from distinct `COUNCIL_MEMBER` holders.

### Requirement: One person once
The system SHALL reject a second `Verdict` from the same `byUserId` on the same operation, even if the user holds another office.

### Requirement: Originator cannot authorize as delegate or council
`createdBy` SHALL NOT exercise `DELEGATED_AUTHORIZER` or `COUNCIL_MEMBER` on that operation. `createdBy` MAY exercise `BRANCH_HEAD`.

### Requirement: Verdict records exercised office
Every `Verdict` SHALL persist `officeCode`. Minutes SHALL name the person "en calidad de {office label}".

### Requirement: Consult is not operate
`COUNCIL_MEMBER` SHALL NOT receive capture or edit permissions. The authorization inbox SHALL list only operations the current user's offices still need to sign or vote.

### Requirement: Approve with changes
`APPROVE_WITH_CHANGES` SHALL require `modifiedAmount` or `modifiedTermMonths` and SHALL force a `CalcResult` recompute.

## Tests

- `packages/domain/src/verdict-policy.test.ts`
- `POST /approvals/resolve` (API adapter)
