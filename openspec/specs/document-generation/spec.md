# Document generation

## Purpose

Documentos generados solo desde plantillas versionadas y aprobadas por la cooperativa.

## Requirements

### Requirement: Versioned templates
Document templates SHALL be versioned in `DocumentTemplate` with `code`, `name`, `templateType`, `approvedByCooperative`, and `active`.

#### Scenario: New template version
- **WHEN** a template changes
- **THEN** a new `DocumentTemplate` version is stored with its code and type

### Requirement: Cooperative approval gate
The system SHALL NOT emit a document when its template has `approvedByCooperative = false`. Seed intent: `APPLICATION_SUMMARY` and `AMORTIZATION` approved; `IVE` and `CONTRACT` provisional until CRECE signs the layout.

#### Scenario: Unapproved template
- **WHEN** a document is requested from a template with `approvedByCooperative = false`
- **THEN** the system does not emit it

### Requirement: Generated document traceability
Each `GeneratedDocument` SHALL record `templateCode`, `templateVersion`, `storageKey`, `dataSnapshot`, `generatedBy`, and `generatedAt`.

Port: `DocumentRenderer` (local PDF, no LLM). Not implemented in this bootstrap.

#### Scenario: Document generated
- **WHEN** a document is emitted
- **THEN** the `GeneratedDocument` records template code, version, storage key, data snapshot, author and time

## Tests

- `apps/api/prisma/schema.prisma` (`DocumentTemplate`, `GeneratedDocument`)
