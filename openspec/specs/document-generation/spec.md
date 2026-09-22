# Document generation

## Requirements

### Requirement: Versioned templates
Document templates SHALL be versioned in `DocumentTemplate` with `code`, `name`, `templateType`, `approvedByCooperative`, and `active`.

### Requirement: Cooperative approval gate
The system SHALL NOT emit a document when its template has `approvedByCooperative = false`. Seed intent: `APPLICATION_SUMMARY` and `AMORTIZATION` approved; `IVE` and `CONTRACT` provisional until CRECE signs the layout.

### Requirement: Generated document traceability
Each `GeneratedDocument` SHALL record `templateCode`, `templateVersion`, `storageKey`, `dataSnapshot`, `generatedBy`, and `generatedAt`.

Port: `DocumentRenderer` (local PDF, no LLM). Not implemented in this bootstrap.

## Tests

- `apps/api/prisma/schema.prisma` (`DocumentTemplate`, `GeneratedDocument`)
