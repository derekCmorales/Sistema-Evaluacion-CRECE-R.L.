## Purpose

Keeps CRECE's approved credit policies (reglamento, manuals, factor vocabulary, cooperative rules) searchable by meaning and by exact terms, with versions and provenance that a citation can point to. It never holds applicant data.

## ADDED Requirements

### Requirement: Approved policy sources only
The knowledge base SHALL contain only cooperative policy sources. Only `SYSTEM_ADMIN` may ingest or approve a source, and only `APPROVED` sources SHALL be retrievable. Applicant documents MUST NOT be indexed.

#### Scenario: Draft source
- **WHEN** a policy source is ingested but not yet approved
- **THEN** its chunks never appear in search results outside the lab preview

#### Scenario: Advisor tries to ingest
- **WHEN** a user without `SYSTEM_ADMIN` sends `IngestKnowledgeSource`
- **THEN** the command is rejected with a permission error

### Requirement: Versioned sources
Approving a new version of a source SHALL deactivate the previous version's chunks for retrieval without deleting them. Chunks cited by past runs MUST remain resolvable.

#### Scenario: Reglamento v4 replaces v3
- **WHEN** v4 is approved
- **THEN** searches return only v4 chunks, and a run that cited a v3 chunk still shows its text and version

### Requirement: Structure-aware chunking
Chunks SHALL follow the document structure (title, chapter, section, article). Chunking MUST satisfy these invariants:
- no chunk exceeds the configured maximum token count;
- a table is never split, or, if it exceeds the maximum, it is split by rows with the header row repeated;
- every chunk carries its section path and page range;
- the concatenated chunk bodies reproduce the normalized source text without loss;
- the same input and chunker version always produce the same chunks.

#### Scenario: Long article
- **WHEN** an article exceeds the maximum
- **THEN** it is split at paragraph, then sentence boundaries, and each part keeps the article's section path

#### Scenario: Short articles
- **WHEN** consecutive articles in the same chapter are below the minimum size
- **THEN** they are merged up to the target size without crossing the chapter boundary

### Requirement: Embedding reuse and consistency
Embeddings SHALL be keyed by chunk content hash, embedding model and dimension, and unchanged chunks MUST reuse their embedding. All retrievable chunks MUST share one model and one dimension. When the configured dimension or model differs from the index, search SHALL refuse to run and report that a reindex is required.

#### Scenario: Re-ingest with two changed articles
- **WHEN** a new version differs from the previous one in two articles
- **THEN** only the chunks whose content changed are sent to the embedding provider

#### Scenario: Dimension changed
- **WHEN** the configured embedding dimension changes from the indexed one
- **THEN** search returns a "reindexación requerida" error until the reindex completes

### Requirement: Hybrid search with provenance
Search SHALL combine semantic similarity with Spanish full-text matching and return ranked results. Each result carries chunk id, source id, version, section path, page range, and the semantic, text and fused scores.

#### Scenario: Exact article reference
- **WHEN** the query contains "artículo 12 fiador"
- **THEN** the chunk for article 12 is among the top results even if its semantic score alone ranks lower

### Requirement: Case-driven retrieval queries
Retrieval for generation SHALL be built from structured case facts: product, guarantee type, purpose, hard-rule hits and guarantor flag. It MUST NOT be built from raw document text.

#### Scenario: Injected text in a receipt
- **WHEN** a receipt contains text crafted to steer retrieval
- **THEN** the retrieval query for that case is unchanged by it

### Requirement: No relevant policy
When no chunk passes the relevance floor, search SHALL return an empty result. Generation SHALL proceed and state that no applicable policy excerpt was found.

#### Scenario: Empty corpus
- **WHEN** no policy source is approved yet
- **THEN** review analysis runs and its summary says "Sin extractos de política aplicables"

## Tests

- `packages/ai-engine/src/chunking/structure-parser.test.ts`
- `packages/ai-engine/src/chunking/structure-aware-chunker.test.ts` (invariants, including property-based cases)
- `packages/ai-engine/src/use-cases/ingest-knowledge-source.test.ts` (versioning, embedding reuse, dimension guard)
- `packages/ai-engine/src/retrieval/case-query-builder.test.ts`
- `apps/api/src/infrastructure/ai/pgvector-knowledge-store.integration.test.ts` (hybrid ranking on Postgres with pgvector)
- `packages/ai-engine/eval/retrieval-golden.json` + lab evaluation (recall@5, MRR)
