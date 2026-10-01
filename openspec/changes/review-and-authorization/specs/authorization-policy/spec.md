# Authorization policy (delta)

## ADDED Requirements

### Requirement: Verdicts cast on the operation
`castVerdict` SHALL apply `resolveRoute`, `officeToExercise`, one-person-once, the originator rule, factor validation and `assertCanApprove` on the stored operation. Each verdict SHALL be appended to `DecisionLog` as `VERDICT_CAST` with the exercised office. When `resolveFinalDecision` closes the route, the operation SHALL transition with `assertTransition`.

#### Scenario: Dual signature completed
- **WHEN** an operation below the threshold receives `APPROVE` from a `BRANCH_HEAD` and then from a different `DELEGATED_AUTHORIZER`
- **THEN** the operation becomes `APPROVED` and the decision log has two entries

#### Scenario: Verdict outside review
- **WHEN** a verdict targets an operation that is not `UNDER_REVIEW`
- **THEN** it is rejected and nothing is logged

### Requirement: Return requires a comment
A `RETURN` verdict SHALL require a comment of at least `justification.minLength` characters, store it as `returnComment` and move the operation to `RETURNED_TO_ADVISOR` when the route closes.

#### Scenario: Return without comment
- **WHEN** a council member returns an operation with an empty comment
- **THEN** the domain rejects it

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
