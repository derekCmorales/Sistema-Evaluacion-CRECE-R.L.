import { createHash } from "node:crypto";
import type { Pool } from "pg";
import { AiEngineError } from "@crece/ai-engine";
import { migration001 } from "./migrations/001-init";
import { migration002 } from "./migrations/002-run-lifecycle";

export type Migration = { id: string; sql: string };

export const AI_MIGRATIONS: Migration[] = [migration001, migration002];

/** Clave de advisory lock para que API y worker no migren a la vez. */
const MIGRATION_LOCK_KEY = 725_301_998;

function render(sql: string, embeddingDims: number): string {
  if (!Number.isInteger(embeddingDims) || embeddingDims < 128 || embeddingDims > 2000) {
    throw new Error("AI_EMBEDDING_DIMENSIONS debe ser un entero entre 128 y 2000");
  }
  return sql.replaceAll("{{EMBEDDING_DIMS}}", String(embeddingDims));
}

const checksum = (sql: string) => createHash("sha256").update(sql).digest("hex");

export type MigrationResult = { applied: string[]; skipped: string[] };

/**
 * Aplica las migraciones pendientes del esquema `ai`, cada una en su transacción.
 * El checksum se calcula sobre la plantilla (no sobre el SQL con la dimensión): editar una
 * migración aplicada es un error; cambiar la dimensión exige reindexar (guarda aparte).
 */
export async function migrateAiSchema(
  pool: Pool,
  embeddingDims: number,
  migrations: Migration[] = AI_MIGRATIONS,
): Promise<MigrationResult> {
  const client = await pool.connect();
  try {
    await client.query("SELECT pg_advisory_lock($1)", [MIGRATION_LOCK_KEY]);
    await client.query("CREATE SCHEMA IF NOT EXISTS ai");
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai.schema_migrations (
        id         text        PRIMARY KEY,
        checksum   text        NOT NULL,
        applied_at timestamptz NOT NULL DEFAULT now()
      )`);
    const { rows } = await client.query<{ id: string; checksum: string }>(
      "SELECT id, checksum FROM ai.schema_migrations",
    );
    const applied = new Map(rows.map((r) => [r.id, r.checksum]));
    const result: MigrationResult = { applied: [], skipped: [] };

    for (const migration of migrations) {
      const sum = checksum(migration.sql);
      const previous = applied.get(migration.id);
      if (previous) {
        if (previous !== sum) {
          throw new Error(`La migración ${migration.id} ya aplicada fue modificada (checksum distinto)`);
        }
        result.skipped.push(migration.id);
        continue;
      }
      await client.query("BEGIN");
      try {
        await client.query(render(migration.sql, embeddingDims));
        await client.query("INSERT INTO ai.schema_migrations (id, checksum) VALUES ($1, $2)", [migration.id, sum]);
        await client.query("COMMIT");
        result.applied.push(migration.id);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }

    await assertIndexDimensions(client, embeddingDims);
    return result;
  } finally {
    await client.query("SELECT pg_advisory_unlock($1)", [MIGRATION_LOCK_KEY]).catch(() => undefined);
    client.release();
  }
}

async function assertIndexDimensions(
  client: { query: Pool["query"] },
  embeddingDims: number,
): Promise<void> {
  const { rows } = await client.query<{ embedding_dims: number }>(
    "SELECT embedding_dims FROM ai.index_config WHERE singleton",
  );
  const indexed = rows[0]?.embedding_dims;
  if (indexed != null && indexed !== embeddingDims) {
    throw new AiEngineError(
      "AI_REINDEX_REQUIRED",
      `La base de conocimiento usa ${indexed} dimensiones y AI_EMBEDDING_DIMENSIONS=${embeddingDims}: se requiere reindexar`,
    );
  }
}
