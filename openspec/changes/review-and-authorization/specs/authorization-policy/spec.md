# Authorization policy (delta)

## ADDED Requirements

### Requirement: Verdicts cast on the operation
`castVerdict` SHALL apply `resolveRoute`, `officeToExercise`, one-person-once, the originator rule, factor validation against the active `DecisionFactor` catalog and `assertCanApprove` (from `ai-alerts.ts`) on the stored operation. `resolveFinalDecision` SHALL receive the number of active council members from `UserDirectory.countByOffice`. Each verdict SHALL be appended to `DecisionLog` as `VERDICT_CAST` with the exercised office. When `resolveFinalDecision` closes the route, the operation SHALL transition with `assertTransition`.

#### Scenario: Dual signature completed
- **WHEN** an operation below the threshold receives `APPROVE` from a `BRANCH_HEAD` and then from a different `DELEGATED_AUTHORIZER`
- **THEN** the operation becomes `APPROVED` and the decision log has two entries

#### Scenario: Verdict outside review
- **WHEN** a verdict targets an operation that is not `UNDER_REVIEW`
- **THEN** it is rejected and nothing is logged

### Requirement: Return and reject require a reason
`RETURN` and `REJECT` verdicts SHALL require a reason of at least `justification.minLength` characters. A `RETURN` that closes the route SHALL store its reason as `returnComment` and move the operation to `RETURNED_TO_ADVISOR`.

#### Scenario: Return without comment
- **WHEN** a council member returns an operation with an empty comment
- **THEN** the domain rejects it

#### Scenario: Reject without reason
- **WHEN** a signer rejects with a reason shorter than the minimum
- **THEN** the domain rejects it

### Requirement: Approved terms with mixed votes
The route band SHALL be fixed by the requested amount at submission. When the route closes as approved and at least one approving verdict is `APPROVE_WITH_CHANGES`, the outcome SHALL be approval with changes, with the lowest `modifiedAmount` and the shortest `modifiedTermMonths` among those verdicts (unchanged values keep the requested ones), and `CalcResult` SHALL be recomputed with them. The band MUST NOT be recomputed with the new amount.

#### Scenario: One approval and two approvals with changes
- **WHEN** a quorum closes with `APPROVE` and two `APPROVE_WITH_CHANGES` to Q130,000 and Q135,000 at 60 months
- **THEN** the operation is approved at Q130,000 and 60 months, with the installment recomputed

### Requirement: Authorization inbox
`GET /approvals/inbox` SHALL list only `UNDER_REVIEW` operations whose route still needs an office the current user can exercise on them, excluding operations where the user already voted or is the originator for delegate or council offices.

#### Scenario: Originator holds a council office
- **WHEN** a user who originated an operation in the quorum band opens the inbox
- **THEN** that operation is not listed for them

### Requirement: Minutes from verdicts
`GET /operations/:id/minutes` SHALL build a `MinutesView` from the verdicts, naming each person "en calidad de" the exercised office, with factors, reasons, approved changes and final state.

#### Scenario: Approve with changes in the minutes
- **WHEN** a council member votes `APPROVE_WITH_CHANGES` to Q130,000
- **THEN** the minutes show the vote, the new amount and the recomputed installment

### Requirement: Actor from the session in authorization
Authorization endpoints SHALL take the actor from the session. `POST /approvals/resolve` MUST NOT accept `actorId`, `originatorId` or prior verdicts in the body.

#### Scenario: Forged signer
- **WHEN** a request body names another user as the signer
- **THEN** the verdict is recorded under the session user or rejected

## Tests

- `packages/domain/src/verdict-casting.test.ts`
- `packages/domain/src/minutes.test.ts`
- `packages/application/src/authorization.test.ts`
- `apps/api/src/modules/approvals/approvals.http.test.ts`
