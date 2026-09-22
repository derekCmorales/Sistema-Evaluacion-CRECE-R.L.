# AI assistance

## Requirements

### Requirement: Human OCR confirmation
OCR-extracted values SHALL be stored as derived `OcrArtifact` candidates with status `PENDING` until a human confirms, corrects, or discards them. Confirmed OCR values MUST NOT mutate `FinancialAssessment`.

### Requirement: Review assistance on submit
Submitting an operation for review SHALL persist `AiAssistance` with summary and alerts. Alerts MUST include `sourceDocumentId`. The pipeline SHALL never write a `Verdict`, score, or risk band.

### Requirement: Unresolved alerts block approval
The system SHALL NOT transition to `APPROVED` while any `AiAlert` lacks `resolution`.

Ports: `OcrProvider`, `LlmAssistant`, `EmbeddingProvider`, `RagStore` (no `I` prefix). Not implemented in this bootstrap.

## Tests

- `packages/domain/src/ocr-confirmation.test.ts`
