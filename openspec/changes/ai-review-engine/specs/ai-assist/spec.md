## MODIFIED Requirements

### Requirement: Human OCR confirmation
OCR-extracted values SHALL be stored as derived `OcrArtifact` candidates with status `PENDING` until a human confirms, corrects, or discards them. Candidates are produced when the document is uploaded (phase 3), not only on submit. Each candidate references its source document and page and carries the provider confidence when available. Confirmed OCR values MUST NOT mutate `FinancialAssessment`. Candidates MUST never be auto-confirmed, whatever their confidence.

#### Scenario: Confirming a candidate leaves the assessment intact
- **WHEN** an advisor confirms an OCR candidate for monthly income
- **THEN** the candidate becomes `CONFIRMED` and `FinancialAssessment` is unchanged

#### Scenario: High confidence is not auto-confirmed
- **WHEN** a candidate is extracted with the maximum confidence
- **THEN** it remains `PENDING` until a human acts on it

### Requirement: Review assistance on submit
Submitting an operation for review SHALL request an AI review analysis that persists `AiAssistance` with a summary and alerts. Each alert MUST include at least one evidence item `{ sourceType: DOCUMENT | POLICY | CALC, sourceId, quote, page? }`. The pipeline SHALL never write a `Verdict`, score, or risk band. If the analysis is unavailable, submitting MUST still succeed: the operation reaches `UNDER_REVIEW`, the review shows that AI analysis is unavailable, and the analysis can be retried.

#### Scenario: Analysis attached after submit
- **WHEN** an operation is submitted for review and the analysis completes
- **THEN** `AiAssistance` holds a summary and alerts, and each alert has at least one evidence item

#### Scenario: Analysis unavailable
- **WHEN** an operation is submitted while the AI engine is disabled or failing
- **THEN** the operation is `UNDER_REVIEW`, `AiAssistance` is absent, and the review shows "Análisis de IA no disponible"

### Requirement: Unresolved alerts block approval
The system SHALL NOT transition to `APPROVED` while any `AiAlert` lacks `resolution`. Dismissing an alert MUST include a non-empty reason. `RETURN` and `REJECT` outcomes are not blocked by unresolved alerts.

#### Scenario: Approve with a pending alert
- **WHEN** a signer casts `APPROVE` and one alert has no resolution
- **THEN** the domain throws "Hay alertas de IA sin resolver" and the operation stays `UNDER_REVIEW`

#### Scenario: Dismiss without reason
- **WHEN** a reviewer dismisses an alert with an empty reason
- **THEN** the domain rejects the resolution with a validation error

#### Scenario: Return with a pending alert
- **WHEN** a signer casts `RETURN` while an alert is unresolved
- **THEN** the operation moves to `RETURNED_TO_ADVISOR`

## ADDED Requirements

### Requirement: 5C draft is a suggestion
An AI 5C draft SHALL be shown as "Sugerencia de IA" and MUST NOT populate `Operation.opinion` by itself. Only the advisor's explicit adoption or edit writes the opinion, attributed to the advisor.

#### Scenario: Draft ignored
- **WHEN** the advisor receives a 5C draft and writes their own opinion without adopting it
- **THEN** `Operation.opinion` contains only the advisor's text

## Tests

- `packages/domain/src/ocr-confirmation.test.ts`
- `packages/domain/src/ai-alerts.test.ts` (evidence shape, `assertCanApprove`, dismiss reason; the latter was untested until now)
- `packages/application/src/submit-for-review.test.ts` (submit succeeds with AI disabled)
