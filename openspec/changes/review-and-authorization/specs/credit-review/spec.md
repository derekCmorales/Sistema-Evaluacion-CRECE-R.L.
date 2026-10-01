# Credit review

## Purpose

Fases 4 y 5 del proceso de crédito: reglas duras con excepción justificada, dictamen 5C escrito por una persona y envío a revisión sin depender de la IA.

## ADDED Requirements

### Requirement: Hard rule thresholds from configuration
`evaluateHardRules` SHALL receive its thresholds from `ConfigRepository` key `hardRules` (an object `Partial<HardRulesConfig>`, merged over `DEFAULT_HARD_RULES_CONFIG`, which is only a seed). `RatesConfig.maxInstallmentToIncomeRatio` MUST NOT be used by hard rules.

#### Scenario: Threshold changed in configuration
- **WHEN** the `hardRules` entry is `{ "maxInstallmentToIncomeRatio": 0.40 }` and the assessment gives a ratio of 0.38
- **THEN** `HIGH_INSTALLMENT_RATIO` is not hit, without any code change

### Requirement: Justified exception to a hard rule
A person with `operation:edit` SHALL be able to justify an exception on a hit present in `hardRuleHits`, with a reason of at least `justification.minLength` characters, only while the operation is editable. The exception SHALL record the reason, the user from the session and the time, and SHALL be logged as `HARD_RULE_EXCEPTION_JUSTIFIED`.

#### Scenario: Exception on a rule that is not hit
- **WHEN** an advisor justifies `LOW_GUARANTEE_COVERAGE` and that rule is not among the current hits
- **THEN** the domain rejects it and nothing changes

#### Scenario: Reason too short
- **WHEN** the reason has fewer characters than `justification.minLength`
- **THEN** the domain rejects it

#### Scenario: Exception after submitting
- **WHEN** the operation is `UNDER_REVIEW` or later
- **THEN** the exception is rejected because the case is not editable

### Requirement: Exceptions follow the assessment
Whenever the hits are recomputed (`recalculate` in `case-file.ts`, called when the assessment or the guarantor changes) and `calcResult.inputsHash` changes, the hits SHALL be recomputed without the previous exceptions. When the hash does not change, existing exceptions SHALL be kept.

#### Scenario: Income corrected after an exception
- **WHEN** an exception was justified and the advisor changes the monthly income
- **THEN** the blocking rule is evaluated again and needs a new exception if it is still hit

### Requirement: Opinion written by a person
The 5C opinion (`Opinion5C`: character, capacity, capital, collateral, conditions) SHALL be saved only by a person with `operation:edit` while the case is editable, and SHALL be logged as `OPINION_SAVED`. An AI draft is a suggestion and MUST NOT be saved as the opinion without a person submitting it.

#### Scenario: Opinion saved by the advisor
- **WHEN** the advisor saves the five sections
- **THEN** the operation stores the opinion and the audit log records who saved it

### Requirement: Ready for review preconditions
`markReadyForReview` SHALL move `DRAFT` or `RETURNED_TO_ADVISOR` to `READY_FOR_REVIEW` only when the case is assembled (`assembledAt` set), no `BLOCK` hit lacks an exception and the five opinion sections have text. Otherwise it SHALL fail listing what is missing.

Only case-file changes (checklist, assessment, guarantor, watch-list checks) clear the assembly record. Saving the opinion or justifying an exception MUST NOT clear it, so these use cases persist without going through the case-file `save()` that clears `assembledAt`.

#### Scenario: Opinion saved after assembling
- **WHEN** the case is assembled and the advisor then saves the opinion and justifies an exception
- **THEN** `assembledAt` is unchanged and the operation can be marked ready

#### Scenario: Missing opinion section
- **WHEN** the case is assembled, all blocking rules have exceptions and "conditions" is empty
- **THEN** the domain rejects the transition and reports the missing section

### Requirement: Reopen capture
`reopenCapture` SHALL move `READY_FOR_REVIEW` or `RETURNED_TO_ADVISOR` back to `DRAFT`, logged as `OPERATION_REOPENED`.

#### Scenario: Correction before sending
- **WHEN** an operation is `READY_FOR_REVIEW` and the advisor reopens it
- **THEN** it returns to `DRAFT` and is editable again

### Requirement: Submit for review never depends on AI
`submitForReview` SHALL move `READY_FOR_REVIEW` to `UNDER_REVIEW`, set `submittedForReviewAt`, open a new review round (clear `verdicts`; the history stays in `DecisionLog`), log `OPERATION_SUBMITTED` and publish `OperationSubmittedForReview` (`type`, `operationId`, `submittedBy`, `occurredAt`, the same shape as the AI engine's schema). If publishing fails, the submission SHALL remain done.

#### Scenario: AI engine is down
- **WHEN** the advisor submits and the facts publisher throws
- **THEN** the operation is `UNDER_REVIEW` and the response is successful

#### Scenario: Resubmission after a return
- **WHEN** an operation returned with one `RETURN` verdict is submitted again
- **THEN** `verdicts` is empty for the new round and the earlier verdict remains in `DecisionLog`

#### Scenario: Submit from draft
- **WHEN** the operation is `DRAFT`
- **THEN** the transition is rejected

### Requirement: Actor from the session
Every endpoint of phases 4 and 5 SHALL take the actor from the session. Fields such as `byUserId`, `userId`, `officeCode` or `source` in the body MUST be ignored.

#### Scenario: Author in the body
- **WHEN** a request body carries `byUserId` of another user
- **THEN** the exception or opinion is recorded under the session user

## Tests

- `packages/domain/src/hard-rule-exception.test.ts`
- `packages/domain/src/review-readiness.test.ts`
- `packages/application/src/review-submission.test.ts`
- `apps/api/src/modules/operations/review.http.test.ts`
