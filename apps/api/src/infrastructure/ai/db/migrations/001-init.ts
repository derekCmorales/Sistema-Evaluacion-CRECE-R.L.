/**
 * Esquema `ai` (design D4/D7). `{{EMBEDDING_DIMS}}` lo reemplaza el migrador con
 * AI_EMBEDDING_DIMENSIONS validado (entero 128–2000). Nunca interpolar otra cosa.
 */
export const migration001 = {
  id: "001-init",
  sql: /* sql */ `
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE SCHEMA IF NOT EXISTS ai;

-- Búsqueda de texto en español sin acentos (inmutable: se usa en columna generada).
CREATE TEXT SEARCH CONFIGURATION ai.es (COPY = pg_catalog.spanish);
ALTER TEXT SEARCH CONFIGURATION ai.es
  ALTER MAPPING FOR hword, hword_part, word WITH public.unaccent, spanish_stem;

-- Índice vectorial: modelo y dimensión vigentes (guarda de reindexación, D7).
CREATE TABLE ai.index_config (
  singleton       boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  embedding_dims  integer NOT NULL,
  embedding_model text,
  updated_at      timestamptz NOT NULL DEFAULT now()
);
INSERT INTO ai.index_config (embedding_dims) VALUES ({{EMBEDDING_DIMS}});

-- Configuración versionada: cada cambio es una fila nueva (historial = auditoría old/new).
CREATE TABLE ai.config (
  key        text        NOT NULL,
  version    integer     NOT NULL,
  value      jsonb       NOT NULL,
  is_seed    boolean     NOT NULL DEFAULT false,
  updated_by text        NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (key, version)
);

CREATE TABLE ai.knowledge_source (
  id             uuid        PRIMARY KEY,
  code           text        NOT NULL,
  version        integer     NOT NULL,
  status         text        NOT NULL CHECK (status IN ('DRAFT', 'APPROVED', 'SUPERSEDED')),
  title          text        NOT NULL,
  effective_from date        NOT NULL,
  file_sha256    text        NOT NULL,
  structure      text        NOT NULL CHECK (structure IN ('STRUCTURED', 'FLAT')),
  approved_by    text,
  approved_at    timestamptz,
  is_lab         boolean     NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (code, version)
);

CREATE TABLE ai.knowledge_chunk (
  id              uuid        PRIMARY KEY,
  source_id       uuid        NOT NULL REFERENCES ai.knowledge_source (id) ON DELETE CASCADE,
  ordinal         integer     NOT NULL,
  section_path    text[]      NOT NULL,
  page_start      integer     NOT NULL,
  page_end        integer     NOT NULL,
  context_header  text        NOT NULL,
  content         text        NOT NULL,
  token_count     integer     NOT NULL,
  content_sha256  text        NOT NULL,
  chunker_version text        NOT NULL,
  embedding_model text        NOT NULL,
  embedding_dims  integer     NOT NULL,
  embedding       halfvec({{EMBEDDING_DIMS}}) NOT NULL,
  tsv             tsvector    GENERATED ALWAYS AS (to_tsvector('ai.es', context_header || ' ' || content)) STORED,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_id, ordinal)
);
CREATE INDEX knowledge_chunk_embedding_hnsw ON ai.knowledge_chunk
  USING hnsw (embedding halfvec_cosine_ops) WITH (m = 16, ef_construction = 64);
CREATE INDEX knowledge_chunk_tsv_gin ON ai.knowledge_chunk USING gin (tsv);
CREATE INDEX knowledge_chunk_reuse ON ai.knowledge_chunk (content_sha256, embedding_model, embedding_dims);

-- Chunks recuperables en producción: fuente aprobada y que no es de laboratorio.
CREATE VIEW ai.knowledge_chunk_active AS
  SELECT c.* FROM ai.knowledge_chunk c
  JOIN ai.knowledge_source s ON s.id = c.source_id
  WHERE s.status = 'APPROVED' AND NOT s.is_lab;

CREATE TABLE ai.document_extraction (
  id               uuid        PRIMARY KEY,
  file_sha256      text        NOT NULL,
  ocr_model        text        NOT NULL,
  document_type    text        NOT NULL,
  schema_code      text        NOT NULL,
  schema_version   integer     NOT NULL,
  pages            jsonb       NOT NULL,
  candidates       jsonb       NOT NULL,
  images           jsonb       NOT NULL,
  raw_response     jsonb,
  raw_purge_after  timestamptz,
  is_lab           boolean     NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (file_sha256, ocr_model, schema_code, schema_version)
);

CREATE TABLE ai.document_link (
  document_ref  text        PRIMARY KEY,
  extraction_id uuid        NOT NULL REFERENCES ai.document_extraction (id) ON DELETE CASCADE,
  operation_id  text,
  linked_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ai.ai_run (
  id                  uuid        PRIMARY KEY,
  task                text        NOT NULL CHECK (task IN ('EXTRACT', 'INGEST', 'SEARCH', 'DRAFT_5C', 'REVIEW', 'EVAL')),
  idempotency_key     text,
  operation_id        text,
  document_ref        text,
  status              text        NOT NULL CHECK (status IN ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'REUSED')),
  model_id            text,
  prompt_version      text,
  input_sha256        text,
  retrieved_chunk_ids uuid[]      NOT NULL DEFAULT '{}',
  usage               jsonb       NOT NULL DEFAULT '{"inputTokens":0,"cachedInputTokens":0,"outputTokens":0,"thinkingTokens":0}',
  cost_estimate_usd   numeric(12, 6),
  latency_ms          integer,
  guard_report        jsonb,
  output              jsonb,
  error_code          text,
  error_message       text,
  requested_by        text,
  forced              boolean     NOT NULL DEFAULT false,
  is_lab              boolean     NOT NULL DEFAULT false,
  attempts            integer     NOT NULL DEFAULT 0,
  input               jsonb,
  created_at          timestamptz NOT NULL,
  started_at          timestamptz,
  finished_at         timestamptz
);
CREATE UNIQUE INDEX ai_run_idempotency ON ai.ai_run (task, idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX ai_run_reuse ON ai.ai_run (task, input_sha256, model_id, prompt_version, is_lab) WHERE status = 'SUCCEEDED';
CREATE INDEX ai_run_operation ON ai.ai_run (operation_id, created_at DESC);
CREATE INDEX ai_run_created ON ai.ai_run (is_lab, created_at DESC);

-- Copia inmutable de lo que dijo la IA; la resolución humana vive en el dominio de crédito.
CREATE TABLE ai.ai_alert (
  id           uuid        PRIMARY KEY,
  run_id       uuid        NOT NULL REFERENCES ai.ai_run (id) ON DELETE CASCADE,
  operation_id text        NOT NULL,
  type         text        NOT NULL,
  message      text        NOT NULL,
  evidence     jsonb       NOT NULL,
  fingerprint  text        NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ai_alert_operation ON ai.ai_alert (operation_id);

CREATE TABLE ai.outbox (
  id           bigserial   PRIMARY KEY,
  event_type   text        NOT NULL,
  payload      jsonb       NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);
CREATE INDEX outbox_pending ON ai.outbox (id) WHERE published_at IS NULL;

CREATE TABLE ai.result_cache (
  namespace  text        NOT NULL,
  key        text        NOT NULL,
  value      jsonb       NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (namespace, key)
);
`,
};
