## Purpose

Produces the two AI assists of the credit process: the advisor's on-demand 5C draft (phase 5) and the review analysis with summary and evidence-backed alerts (phase 6). Both run over a minimized case context, and neither makes a decision.

## ADDED Requirements

### Requirement: On-demand 5C draft
When an advisor requests it, the engine SHALL produce a draft with the five sections (character, capacity, capital, conditions, collateral) labeled as a suggestion. The draft MUST NOT be written into the operation's opinion. The advisor adopts or edits it explicitly, and the adopted text is attributed to the advisor.

#### Scenario: Advisor presses "Borrador 5C"
- **WHEN** the advisor requests a 5C draft on a `DRAFT` operation
- **THEN** a `Draft5CReady` event returns five sections marked "Sugerencia de IA", and `Operation.opinion` is unchanged

### Requirement: Review analysis on submit
When an operation is submitted for review, the engine SHALL produce a one-page summary and a list of alerts. Every alert carries a type, a message in es-GT, and at least one evidence item `{ sourceType: DOCUMENT | POLICY | CALC, sourceId, quote, page? }`.

#### Scenario: Bureau mismatch
- **WHEN** the declared monthly debt differs from the confirmed bureau value
- **THEN** a `BUREAU_MISMATCH` alert cites the bureau document page and the declared value

### Requirement: Route-independent analysis
The analysis input SHALL NOT include the authorization route. The same case MUST produce the same analysis whether it is resolved by dual signature below the threshold or by the Council at or above it.

#### Scenario: Q150,000 case
- **WHEN** a Q150,000 operation is analyzed
- **THEN** the analysis request contains no threshold, route or office information

### Requirement: Minimized case context
The model input SHALL contain only the case snapshot fields defined by the contract: product, amounts, term, purpose, assessment values, calc result, hard-rule hits, confirmed or corrected OCR values, and document page text. Personal identifiers are replaced by pseudonyms (see `ai-safety`).

#### Scenario: Guarantor data
- **WHEN** the case has a guarantor with DPI and phone
- **THEN** the provider payload contains the guarantor's pseudonym and no DPI or phone

### Requirement: Structured, validated output
Generation SHALL request schema-constrained output and validate it before persisting. Invalid output SHALL be retried once. A second failure marks the run `FAILED`, and nothing partial is persisted.

#### Scenario: Malformed response
- **WHEN** the model returns output that does not match the schema twice
- **THEN** the run is `FAILED` with reason "salida inválida" and no alerts are stored

### Requirement: Stale analysis detection
Each analysis SHALL store the hash of its inputs. If the case snapshot changes after the analysis, the analysis SHALL be shown as outdated and can be re-run.

#### Scenario: Amount changed after analysis
- **WHEN** the requested amount changes after the analysis completed
- **THEN** the analysis is shown as "Desactualizado" with a re-run option

### Requirement: Run traceability
Every generation run SHALL record: operation id, task, model id, prompt version, input hash, retrieved chunk ids, evidence ids, token usage (input, cached, output, thinking), cost estimate, latency, status and the requesting user.

#### Scenario: Audit of an analysis
- **WHEN** `OVERSIGHT` inspects an operation's AI analysis
- **THEN** they can see which model and prompt version produced it and which policy chunks it used

## Tests

- `packages/ai-engine/src/use-cases/request-draft-5c.test.ts`
- `packages/ai-engine/src/use-cases/run-review-analysis.test.ts` (route independence, validation retry, stale detection)
- `packages/ai-engine/src/context/case-context-builder.test.ts`
- `packages/ai-engine/src/generation/output-schemas.test.ts`
- `apps/api/src/infrastructure/ai/gemini-llm.contract.test.ts` (contract; real provider only when credentials exist)
