/**
 * Ciclo de vida robusto de ejecuciones, deduplicación por huella y separación lab/producción.
 * - Una ejecución FAILED ya no bloquea su clave de idempotencia (se puede volver a pedir).
 * - `retry_of` enlaza un reintento con la ejecución fallida (historial).
 * - Extracciones deduplicadas por (bytes, modelo, huella del pipeline, lab).
 * - Outbox con intentos y descarte (dead letter) para el relay.
 * - Latido de workers (para saber si hay quien consuma la cola).
 */
export const migration002 = {
  id: "002-run-lifecycle",
  sql: /* sql */ `
DROP INDEX ai.ai_run_idempotency;
CREATE UNIQUE INDEX ai_run_idempotency ON ai.ai_run (task, idempotency_key)
  WHERE idempotency_key IS NOT NULL AND status <> 'FAILED';

ALTER TABLE ai.ai_run ADD COLUMN retry_of uuid REFERENCES ai.ai_run (id) ON DELETE SET NULL;
CREATE INDEX ai_run_active ON ai.ai_run (status, created_at) WHERE status IN ('QUEUED', 'RUNNING');

ALTER TABLE ai.document_extraction
  ADD COLUMN pipeline_fingerprint text,
  ADD COLUMN injection_suspected boolean NOT NULL DEFAULT false;
-- Filas previas: huella "legacy" (nunca coincide con una nueva, así que se vuelven a extraer).
UPDATE ai.document_extraction SET pipeline_fingerprint = 'legacy:' || schema_code || '@' || schema_version;
ALTER TABLE ai.document_extraction ALTER COLUMN pipeline_fingerprint SET NOT NULL;

DO $$
DECLARE constraint_name text;
BEGIN
  SELECT c.conname INTO constraint_name
  FROM pg_constraint c
  WHERE c.conrelid = 'ai.document_extraction'::regclass AND c.contype = 'u';
  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE ai.document_extraction DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;
CREATE UNIQUE INDEX document_extraction_key
  ON ai.document_extraction (file_sha256, ocr_model, pipeline_fingerprint, is_lab);
CREATE INDEX document_extraction_lab_created ON ai.document_extraction (created_at) WHERE is_lab;
CREATE INDEX document_extraction_raw_purge ON ai.document_extraction (raw_purge_after) WHERE raw_response IS NOT NULL;

ALTER TABLE ai.outbox
  ADD COLUMN attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN last_error text,
  ADD COLUMN dead_at timestamptz;
DROP INDEX ai.outbox_pending;
CREATE INDEX outbox_pending ON ai.outbox (id) WHERE published_at IS NULL AND dead_at IS NULL;

CREATE TABLE ai.worker_heartbeat (
  worker_id    text        PRIMARY KEY,
  started_at   timestamptz NOT NULL,
  last_seen_at timestamptz NOT NULL,
  concurrency  integer     NOT NULL
);
`,
};
