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
Commands that call external providers SHALL be accepted immediately with a run id and executed in the background. Creating the run and enqueueing its job SHALL be one atomic step. A command repeated with the same idempotency key while a run is alive SHALL NOT create a second run; a failed run does not hold its key.

#### Scenario: Duplicate submission
- **WHEN** `RunReviewAnalysis` is sent twice for the same operation with the same idempotency key
- **THEN** both calls return the same run id and the provider is called at most once

#### Scenario: Queue unavailable at submission
- **WHEN** enqueueing the job fails
- **THEN** the command fails and no run is left waiting forever

### Requirement: Exactly-one execution and no stuck runs
A run SHALL be executed by one worker at a time: a worker claims it atomically, and another worker may take it over only after the claim expires. A run that does not finish within the configured stall period SHALL be marked failed as interrupted (retryable), with its failure event. An authorized user can retry any failed run; the retry is a new run with the same input, linked to the failed one.

#### Scenario: Two workers receive the same job
- **WHEN** the queue redelivers a job while another worker is processing it
- **THEN** the provider is called once

#### Scenario: Worker dies mid-run
- **WHEN** the worker stops and no one finishes the run within the stall period
- **THEN** the run is `FAILED` with `AI_RUN_INTERRUPTED`, `AiRunFailed` is emitted with `retryable = true`, and a retry creates a new run

### Requirement: Host facts entry point and event delivery
Host facts SHALL enter the engine through one entry point that maps each fact to a command; a fact that does not trigger work yet returns no run. Engine events SHALL carry a unique `eventId` and a schema version, and be delivered at least once to in-process subscribers of the host; consumers deduplicate by `eventId`. An event whose consumer keeps failing is set aside after a configured number of attempts without blocking other events.

#### Scenario: Fact delivered twice
- **WHEN** the host publishes the same `DocumentUploaded` twice
- **THEN** a single extraction run exists

#### Scenario: Consumer temporarily down
- **WHEN** a subscriber throws while handling `DocumentExtractionCompleted`
- **THEN** the event is retried on the next pass and is not lost

### Requirement: The lab is optional
Production code SHALL NOT depend on the internal lab. The engine module receives additional document sources generically; only composition roots decide whether the lab is registered.

#### Scenario: Import from production code
- **WHEN** a production module imports a lab file
- **THEN** the architecture test fails and names the import

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
- `packages/ai-engine/src/use-cases/run-lifecycle.test.ts` (claim, retry, stalled runs, host facts, status)
- `packages/ai-engine/src/use-cases/run-review-analysis.test.ts` (idempotency, write isolation with fakes)
- `packages/ai-engine/src/architecture/architecture.test.ts` and `packages/ai-engine/src/architecture/import-scanner.test.ts` (includes lab isolation)
- `apps/api/src/modules/ai/ai-disabled.test.ts`
- `apps/api/src/infrastructure/ai/db/pg-stores.integration.test.ts` and `queue/job-queue.integration.test.ts` (atomic admission, claim, outbox relay)
- `apps/api/src/modules/ai/ai-runtime.integration.test.ts` (API + worker + queue + outbox end to end)
