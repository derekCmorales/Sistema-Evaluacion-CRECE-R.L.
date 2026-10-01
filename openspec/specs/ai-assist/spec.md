# AI assistance

## Purpose

Asistencia de IA en la revisión: candidatos de OCR confirmados por personas, resumen y alertas con evidencia, nunca un veredicto.

## Requirements

### Requirement: Human OCR confirmation
OCR-extracted values SHALL be stored as derived `OcrArtifact` candidates with status `PENDING` until a human confirms, corrects, or discards them. Confirmed OCR values MUST NOT mutate `FinancialAssessment`.

#### Scenario: Pending OCR candidate
- **WHEN** OCR extracts a value from a document
- **THEN** it is stored as a `PENDING` candidate
- **AND** `FinancialAssessment` does not change until a person captures the value

### Requirement: Review assistance on submit
Submitting an operation for review SHALL persist `AiAssistance` with summary and alerts. Alerts MUST include `sourceDocumentId`. The pipeline SHALL never write a `Verdict`, score, or risk band.

#### Scenario: Submit triggers assistance
- **WHEN** an operation is submitted for review
- **THEN** an `AiAssistance` with summary and alerts is persisted
- **AND** no `Verdict`, score or risk band is written

### Requirement: Unresolved alerts block approval
The system SHALL NOT transition to `APPROVED` while any `AiAlert` lacks `resolution`.

Ports: `OcrProvider`, `LlmAssistant`, `EmbeddingProvider`, `RagStore` (no `I` prefix). Not implemented in this bootstrap.

#### Scenario: Approve with an open alert
- **WHEN** an operation has an `AiAlert` without `resolution`
- **THEN** a transition to `APPROVED` is rejected

## Tests

- `packages/domain/src/ocr-confirmation.test.ts`
