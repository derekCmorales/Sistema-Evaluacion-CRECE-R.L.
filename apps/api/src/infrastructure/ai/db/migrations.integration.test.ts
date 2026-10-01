import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AI_MIGRATIONS, migrateAiSchema } from "./migrator";
import { migration001 } from "./migrations/001-init";
import { createTestDatabase, type TestDatabase } from "./test-database";

describe("migraciones del esquema ai (Postgres + pgvector)", () => {
  let db: TestDatabase;

  beforeAll(async () => {
    db = await createTestDatabase();
  });

  afterAll(async () => {
    await db?.drop();
  });

  it("aplica sobre una base vacía", async () => {
    const result = await migrateAiSchema(db.pool, 768);
    expect(result.applied).toEqual(["001-init", "002-run-lifecycle"]);

    const { rows: ext } = await db.pool.query(
      "SELECT extname, extversion FROM pg_extension WHERE extname IN ('vector','unaccent') ORDER BY extname",
    );
    expect(ext.map((r) => r.extname)).toEqual(["unaccent", "vector"]);

    const { rows: tables } = await db.pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'ai' ORDER BY table_name",
    );
    expect(tables.map((r) => r.table_name)).toEqual(
      expect.arrayContaining([
        "ai_alert",
        "ai_run",
        "config",
        "document_extraction",
        "document_link",
        "index_config",
        "knowledge_chunk",
        "knowledge_chunk_active",
        "knowledge_source",
        "outbox",
        "result_cache",
        "schema_migrations",
        "worker_heartbeat",
      ]),
    );
  });

  it("la columna de embeddings tiene la dimensión configurada", async () => {
    const { rows } = await db.pool.query(
      "SELECT format_type(atttypid, atttypmod) AS type FROM pg_attribute WHERE attrelid = 'ai.knowledge_chunk'::regclass AND attname = 'embedding'",
    );
    expect(rows[0].type).toBe("halfvec(768)");
  });

  it("es idempotente", async () => {
    const again = await migrateAiSchema(db.pool, 768);
    expect(again).toEqual({ applied: [], skipped: AI_MIGRATIONS.map((m) => m.id) });
  });

  it("detecta cambio de dimensión y exige reindexar", async () => {
    await expect(migrateAiSchema(db.pool, 1536)).rejects.toMatchObject({ code: "AI_REINDEX_REQUIRED" });
  });

  it("detecta una migración aplicada que fue editada", async () => {
    await expect(
      migrateAiSchema(db.pool, 768, [{ id: "001-init", sql: "SELECT 1" }]),
    ).rejects.toThrow("fue modificada");
  });

  it("el texto en español ignora acentos y usa raíces", async () => {
    const { rows } = await db.pool.query(
      "SELECT to_tsvector('ai.es', 'Garantía hipotecaria del fiador') @@ websearch_to_tsquery('ai.es', 'garantia fiadores') AS match",
    );
    expect(rows[0].match).toBe(true);
  });
});

describe("migración 002 sobre una base que ya tenía 001 con datos", () => {
  let db: TestDatabase;

  beforeAll(async () => {
    db = await createTestDatabase();
    await migrateAiSchema(db.pool, 768, [migration001]);
    await db.pool.query(
      `INSERT INTO ai.document_extraction (id, file_sha256, ocr_model, document_type, schema_code, schema_version, pages, candidates, images)
       VALUES ('00000000-0000-4000-8000-000000000001', 'sha', 'mistral-ocr-latest', 'DPI', 'DPI', 1, '[]', '[]', '[]')`,
    );
    await db.pool.query(
      `INSERT INTO ai.ai_run (id, task, idempotency_key, status, created_at)
       VALUES ('00000000-0000-4000-8000-000000000002', 'EXTRACT', 'extract:doc', 'FAILED', now())`,
    );
  });

  afterAll(async () => {
    await db?.drop();
  });

  it("aplica, conserva las filas y les da una huella legacy que no se reutiliza", async () => {
    expect((await migrateAiSchema(db.pool, 768)).applied).toEqual(["002-run-lifecycle"]);
    const { rows } = await db.pool.query("SELECT pipeline_fingerprint, injection_suspected FROM ai.document_extraction");
    expect(rows).toEqual([{ pipeline_fingerprint: "legacy:DPI@1", injection_suspected: false }]);
  });

  it("la clave de una ejecución FAILED queda libre", async () => {
    await db.pool.query(
      `INSERT INTO ai.ai_run (id, task, idempotency_key, status, created_at)
       VALUES ('00000000-0000-4000-8000-000000000003', 'EXTRACT', 'extract:doc', 'QUEUED', now())`,
    );
    await expect(
      db.pool.query(
        `INSERT INTO ai.ai_run (id, task, idempotency_key, status, created_at)
         VALUES ('00000000-0000-4000-8000-000000000004', 'EXTRACT', 'extract:doc', 'QUEUED', now())`,
      ),
    ).rejects.toThrow(/ai_run_idempotency/);
  });

  it("la deduplicación de extracciones distingue lab y producción", async () => {
    const insert = (id: string, isLab: boolean) =>
      db.pool.query(
        `INSERT INTO ai.document_extraction (id, file_sha256, ocr_model, document_type, schema_code, schema_version, pipeline_fingerprint, pages, candidates, images, is_lab)
         VALUES ($1, 'sha2', 'mistral-ocr-4-1', 'DPI', 'DPI', 1, 'extract-v2:x', '[]', '[]', '[]', $2)`,
        [id, isLab],
      );
    await insert("00000000-0000-4000-8000-000000000010", false);
    await insert("00000000-0000-4000-8000-000000000011", true);
    await expect(insert("00000000-0000-4000-8000-000000000012", true)).rejects.toThrow(/document_extraction_key/);
  });
});
