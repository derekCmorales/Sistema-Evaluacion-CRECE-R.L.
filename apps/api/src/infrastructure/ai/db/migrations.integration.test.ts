import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { migrateAiSchema } from "./migrator";
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
    expect(result.applied).toEqual(["001-init"]);

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
    expect(again).toEqual({ applied: [], skipped: ["001-init"] });
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
