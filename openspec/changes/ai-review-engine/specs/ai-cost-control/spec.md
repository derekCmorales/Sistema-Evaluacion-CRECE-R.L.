## Purpose

Keeps AI spending predictable for the cooperative: never pay twice for the same work, maximize provider caching, bound every run, and make cost visible per case and per month.

## ADDED Requirements

### Requirement: Result reuse
A generation request whose input hash, task, model id and prompt version match a successful previous run SHALL return that result without calling the provider. A user may force regeneration, and the forced run records who requested it.

#### Scenario: 5C requested twice without changes
- **WHEN** the advisor requests the 5C draft again with an unchanged case
- **THEN** the previous draft is returned and no tokens are consumed

### Requirement: Query embedding cache
Embeddings of retrieval queries SHALL be cached by normalized query text, model and dimension.

#### Scenario: Repeated retrieval
- **WHEN** two cases produce the same retrieval query
- **THEN** the query embedding is computed once

### Requirement: Cache-friendly prompt layout
Prompts SHALL place the content that is identical across requests first (instructions, output schema, pinned policy excerpts), followed by case content and finally the task. Cached input tokens reported by the provider SHALL be recorded per run.

#### Scenario: Two calls on the same case within minutes
- **WHEN** two generation calls for the same case are made in a short interval
- **THEN** the second run records a non-zero cached input token count if the provider served the shared prefix from cache

### Requirement: Token budgets
Each task SHALL have configured maximum input and output tokens and a reasoning level. When the case context exceeds the input budget, content SHALL be reduced in priority order (confirmed fields are kept, then cited pages, then remaining pages). The run is marked as trimmed. Text MUST NOT be cut mid-page.

#### Scenario: Very large expediente
- **WHEN** the case context exceeds the input budget
- **THEN** lower-priority pages are omitted whole and the summary states "Contexto recortado"

### Requirement: Batch for non-interactive work
Policy ingestion embeddings and scheduled evaluations SHALL use the provider's batch mode when enabled in configuration. Interactive tasks (5C draft, review analysis) SHALL NOT.

#### Scenario: Ingest a 60-page manual
- **WHEN** batch mode is enabled and a manual is ingested
- **THEN** its chunk embeddings are requested through the batch mode

### Requirement: Concurrency and rate limits
Provider calls SHALL respect configured concurrency limits and back off on rate-limit responses.

#### Scenario: Rate limited
- **WHEN** the provider returns a rate-limit response
- **THEN** the call is retried after backoff, and the run is not marked failed until retries are exhausted

### Requirement: Cost visibility and budget warning
The system SHALL report token usage and estimated cost per run, per operation and per calendar month. The provider prices are configuration. When monthly spend crosses a configured threshold, `SYSTEM_ADMIN` is warned.

#### Scenario: Monthly threshold crossed
- **WHEN** estimated spend for the month exceeds the warning threshold
- **THEN** `SYSTEM_ADMIN` receives a notification with the month's total and top tasks by cost

## Tests

- `packages/ai-engine/src/use-cases/result-reuse.test.ts`
- `packages/ai-engine/src/context/token-budget.test.ts`
- `packages/ai-engine/src/prompts/prompt-layout.test.ts` (stable prefix ordering)
- `packages/ai-engine/src/usage/cost-estimator.test.ts`
