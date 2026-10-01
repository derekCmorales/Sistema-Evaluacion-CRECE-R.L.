# AI assistance (delta)

## ADDED Requirements

### Requirement: Alert resolution before signing
While an operation is `UNDER_REVIEW`, a person with `operation:review-alerts` SHALL resolve each `AiAlert` as `CONFIRMED` or `DISMISSED` with a reason of at least `justification.minLength` characters, logged as `AI_ALERT_RESOLVED`. A resolved alert MUST NOT be resolved again.

#### Scenario: Dismiss without reason
- **WHEN** the advisor dismisses an alert with an empty reason
- **THEN** the domain rejects it

#### Scenario: Signer tries to resolve
- **WHEN** a `COUNCIL_MEMBER` without capture offices resolves an alert
- **THEN** the permission check denies it

### Requirement: Analysis unavailable is visible and retryable
When the review analysis failed or has not arrived, the operation SHALL show that AI analysis is unavailable and offer a retry (`POST /operations/:id/ai-review/retry`, logged as `AI_REVIEW_RETRIED`). Signing SHALL continue; only approval waits for existing alerts to be resolved.

#### Scenario: Provider timeout
- **WHEN** the analysis run fails
- **THEN** the AI review tab shows the failure and a retry action, and the operation stays `UNDER_REVIEW`

## Tests

- `packages/domain/src/ai-alerts.test.ts`
- `packages/application/src/ai-review.test.ts`
- `apps/api/src/modules/ai/subscribers.test.ts`
