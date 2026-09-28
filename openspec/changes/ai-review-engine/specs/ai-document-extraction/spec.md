## Purpose

Turns uploaded expediente documents (DPI, bureau report, receipts, statements, sketches, photos) into text and field candidates that a human confirms. The source page is always traceable, and the extraction never writes to the financial assessment.

## ADDED Requirements

### Requirement: Extraction on upload
When a document is uploaded to a checklist item, the engine SHALL extract its text and, for known document types, its fields as OCR candidates in `PENDING` status. Extraction MUST NOT change `FinancialAssessment`.

#### Scenario: Bureau report uploaded
- **WHEN** an advisor uploads a bureau report PDF to its checklist item
- **THEN** a `DocumentExtractionCompleted` event is emitted with page text and `PENDING` candidates for the bureau schema fields

### Requirement: Document type schemas
Field extraction SHALL be driven by a registry of versioned schemas per document type. A document without a registered schema SHALL still yield page text, but no candidates.

#### Scenario: Unknown type
- **WHEN** a document of a type without a schema is extracted
- **THEN** page text is stored and the candidate list is empty

### Requirement: Page provenance and confidence
Every candidate SHALL reference its document id and page, and SHALL include the provider confidence and region when the provider returns them. Candidates below the configured confidence threshold SHALL be marked for attention. Candidates MUST never be auto-confirmed.

#### Scenario: Low-confidence DPI number
- **WHEN** the DPI number is extracted with confidence below the threshold
- **THEN** the candidate stays `PENDING` and is flagged "Revisar: baja confianza"

### Requirement: Deduplicated extraction
Extraction results SHALL be keyed by the file content hash, the OCR model version and the schema version. The same key MUST reuse the stored result without calling the provider.

#### Scenario: Same file uploaded twice
- **WHEN** identical bytes are uploaded to two checklist items
- **THEN** the provider is called once and both documents reference the same extraction

### Requirement: Headers, footers and page artifacts
Repeated page headers, footers and page numbers SHALL be kept separate from the body text, so they are neither sent to the model nor indexed.

#### Scenario: Letterhead on every page
- **WHEN** a 10-page statement has the same letterhead on each page
- **THEN** the body text of each page excludes the letterhead

### Requirement: Image handling
Images inside documents SHALL be classified. Logos and decoration are discarded. Signatures and seals are recorded only as present or absent. Sketches and business photos get a text description. The system MUST NOT perform biometric or signature-authenticity checks.

#### Scenario: Signed contract page
- **WHEN** a page contains a handwritten signature
- **THEN** the extraction records "firma presente" for that page and stores no signature comparison

### Requirement: Input limits and failures
Accepted inputs SHALL be PDF, JPEG and PNG within configured size and page limits. Encrypted, corrupt or oversized files SHALL fail with a specific reason. Transient provider errors SHALL be retried with backoff up to a configured limit, then marked `FAILED` with an `AiRunFailed` event. The checklist item keeps its upload, and a user can retry the extraction.

#### Scenario: Password-protected PDF
- **WHEN** a password-protected PDF is uploaded
- **THEN** the extraction fails with reason "PDF protegido con contraseña" and no provider call is made

#### Scenario: Provider timeout
- **WHEN** the OCR provider times out on every retry
- **THEN** the extraction is `FAILED`, the document remains `Cargado`, and a retry is available

## Tests

- `packages/ai-engine/src/extraction/ocr-normalizer.test.ts`
- `packages/ai-engine/src/extraction/document-schemas.test.ts`
- `packages/ai-engine/src/use-cases/extract-document.test.ts` (dedupe, limits, retries with fakes)
- `apps/api/src/infrastructure/ai/mistral-ocr.contract.test.ts` (contract; real provider only when credentials exist)
