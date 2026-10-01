## Purpose

Gives the AI coordinator and the team an internal lab for hands-on testing of every stage of the AI engine with real test files before the full credit flow is wired. It uses the same use cases as production and is never available in production.

## ADDED Requirements

### Requirement: Non-production availability
The lab SHALL be available only when explicitly enabled by configuration in a non-production environment. In production, or when it is disabled, both the lab pages and the lab API endpoints SHALL respond as not found. Once authentication exists, access is limited to `SYSTEM_ADMIN`.

#### Scenario: Production build
- **WHEN** `NODE_ENV` is production, even if the lab flag is set
- **THEN** `/lab/ia` and the lab API endpoints return 404

### Requirement: Optional and isolated
The lab SHALL depend on the engine and never the other way around: removing the lab module leaves the engine and the rest of the API unchanged. The lab SHALL never show production runs or extractions.

#### Scenario: Production extraction id in the lab
- **WHEN** the lab is asked for an extraction that is not tagged as lab
- **THEN** it responds 404

### Requirement: Same code path as production
Lab actions SHALL invoke the engine's public commands and queries. There is no lab-only reimplementation of extraction, chunking, retrieval or generation.

#### Scenario: Extraction in the lab
- **WHEN** a PDF is extracted from the lab
- **THEN** the run is produced by `ExtractDocument` and appears in the run history like any other run, tagged as lab

### Requirement: Extraction view
The lab SHALL let a user upload a PDF or image, choose the document type, and see, per page: the extracted text next to the original, the field candidates with confidence, the image classifications (labeled as model descriptions), injection signals, and the latency and cost. A failed run can be retried from the view. When a run waits in the queue and no worker is alive, the view says so.

#### Scenario: No worker running
- **WHEN** a run stays queued and no worker heartbeat is recent
- **THEN** the lab shows "No hay ningún worker corriendo" with the command to start it

#### Scenario: Uploaded file is not what it claims
- **WHEN** an HTML file is uploaded with a PDF name and content type
- **THEN** the lab serves it back only as a downloadable binary, never rendered

#### Scenario: Test DPI
- **WHEN** a synthetic DPI image is uploaded as type DPI
- **THEN** the lab shows the DPI schema fields with their confidence and source page

### Requirement: Knowledge view
The lab SHALL let a user ingest a policy source and inspect its chunks: section path, pages, token count and content hash.

#### Scenario: Inspect reglamento chunks
- **WHEN** a reglamento PDF is ingested in the lab
- **THEN** the lab lists its chunks in order with their section paths

### Requirement: Search view
The lab SHALL let a user run a free-text or case-derived query with adjustable retrieval parameters (result count, fusion weights, index search breadth). It shows results with semantic, text and fused scores and the database query plan.

#### Scenario: Compare parameters
- **WHEN** the user runs the same query with two result counts
- **THEN** both result lists and their scores are shown side by side

### Requirement: Run inspection view
For any 5C or review run, the lab SHALL show:
- the pseudonymized prompt and the raw model response;
- each guard's outcome (schema, grounding, forbidden content, injection);
- token usage, including cached tokens, and cost.

#### Scenario: Grounding failure visible
- **WHEN** an alert is dropped for an ungrounded quote
- **THEN** the run view shows the dropped alert and the reason

### Requirement: Evaluation runs
The lab SHALL run the golden sets (extraction fields, retrieval questions, red-team cases) and store the results with prompt version, model id, chunker version and embedding dimension, so that runs can be compared over time.

#### Scenario: Compare embedding dimensions
- **WHEN** retrieval evaluation runs at two embedding dimensions
- **THEN** the lab shows recall@5 and MRR for each

### Requirement: Synthetic data and retention
The lab SHALL warn on every upload that only synthetic or anonymized files may be used. Lab files and runs SHALL be stored apart from production data and purged after a configured retention period: files, finished lab runs, lab extractions, lab knowledge sources and lab events. Production rows and runs in progress are never purged.

#### Scenario: Retention elapsed
- **WHEN** a lab file is older than the retention period
- **THEN** it and its extraction are deleted by the scheduled purge

## Tests

- `apps/api/src/modules/ai/lab/lab.guard.test.ts` (404 in production or when disabled)
- `apps/api/src/modules/ai/lab/lab.controller.test.ts` (delegates to engine commands, content-sniffed file serving, no production data, retry, status)
- `apps/api/src/infrastructure/ai/lab/fs-document-source.test.ts`
- `apps/api/src/infrastructure/ai/db/pg-stores.integration.test.ts` (lab retention never touches production)
- `packages/ai-engine/src/architecture/import-scanner.test.ts` (nothing depends on the lab)
- Manual acceptance checklist in `openspec/changes/ai-review-engine/lab-acceptance.md` (complements, never replaces, the tests above)
