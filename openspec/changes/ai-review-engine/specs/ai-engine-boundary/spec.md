## Purpose

Defines the AI engine as an isolated bounded context: the only ways the rest of the system talks to it (commands, events, host ports), what data it may read and write, and how the credit process keeps working when AI is disabled or unavailable.

## ADDED Requirements

### Requirement: Public contract only
The AI engine SHALL expose exactly one public surface: commands (`ExtractDocument`, `IngestKnowledgeSource`, `SearchKnowledge`, `RequestDraft5C`, `RunReviewAnalysis`), events (`DocumentExtractionCompleted`, `KnowledgeSourceIndexed`, `Draft5CReady`, `ReviewAnalysisCompleted`, `AiRunFailed`), result DTOs, the host ports it requires, and test fakes. Any other module MUST NOT import engine internals, and the engine MUST NOT import application modules, the ORM, or HTTP/UI frameworks.

#### Scenario: Deep import is rejected
- **WHEN** code outside the engine imports a file under the engine's internal folders
- **THEN** the architecture test in `pnpm test` fails and names the offending import

#### Scenario: Engine imports the ORM
- **WHEN** engine code imports the ORM client or a Nest/Next module
- **THEN** the architecture test fails

### Requirement: Host ports for reading core data
The engine SHALL read core data only through host-implemented ports: a document source that returns bytes and metadata by document id, and a case snapshot source that returns a read-only, minimized case snapshot by operation id. The engine MUST NOT query core tables directly.

#### Scenario: Snapshot is the only case input
- **WHEN** a review analysis runs for an operation
- **THEN** every case datum sent to the model comes from the case snapshot returned by the host port

### Requirement: Write isolation
The engine SHALL persist only in its own database schema (`ai`). It MUST NOT create or modify `Operation`, `Verdict`, `CalcResult`, `FinancialAssessment`, `DecisionLogEntry` or checklist records. The engine reports its outcomes only through events and read queries.

#### Scenario: Analysis completes
- **WHEN** a review analysis finishes successfully
- **THEN** the operation state, assessment, calc result and verdicts are byte-identical to before the run, and a `ReviewAnalysisCompleted` event carries the result reference

### Requirement: Asynchronous, idempotent commands
Commands that call external providers SHALL be accepted immediately with a run id and executed in the background. A command repeated with the same idempotency key SHALL NOT create a second run.

#### Scenario: Duplicate submission
- **WHEN** `RunReviewAnalysis` is sent twice for the same operation with the same idempotency key
- **THEN** both calls return the same run id and the provider is called at most once

### Requirement: Feature flag and graceful degradation
The engine SHALL be switchable by configuration. When disabled or when a run fails permanently, the credit process MUST continue: submitting for review is not blocked, and the operation shows that AI analysis is unavailable with the option to retry.

#### Scenario: AI disabled
- **WHEN** the AI engine is disabled and an advisor submits an operation for review
- **THEN** the operation reaches `UNDER_REVIEW` and the review shows "Análisis de IA no disponible"

#### Scenario: Provider down
- **WHEN** the review analysis fails after exhausting retries
- **THEN** an `AiRunFailed` event is emitted, the operation stays `UNDER_REVIEW`, and an authorized user can retry the analysis

### Requirement: Provider configuration
Model ids per task, provider backend, authentication mode, region and embedding dimensions SHALL come from configuration, not code. Every run MUST record the model id actually used.

#### Scenario: Model change
- **WHEN** the configured generation model id changes
- **THEN** the next run uses and records the new model id with no code change

### Requirement: Credentials stay server-side
Provider credentials SHALL exist only in the API/worker environment. They MUST NOT be exposed to the web bundle, logs, run records, or error messages.

#### Scenario: Provider error message
- **WHEN** a provider call fails with an authentication error
- **THEN** the stored error and logs contain no key material

## Tests

- `packages/ai-engine/src/contracts/contracts.test.ts`
- `packages/ai-engine/src/use-cases/run-review-analysis.test.ts` (idempotency, write isolation with fakes)
- `packages/ai-engine/src/architecture.test.ts` and `packages/ai-engine/src/import-scanner.test.ts`
- `apps/api/src/modules/ai/ai-disabled.test.ts`
