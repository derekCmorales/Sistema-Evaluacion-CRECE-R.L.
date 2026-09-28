import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { createAiPool } from "./pool";

/**
 * Base temporal para pruebas de integración: se crea vacía y se borra al final, sin tocar
 * la base de desarrollo. Requiere `docker compose up -d db`.
 */
export const INTEGRATION_DATABASE_URL =
  process.env.AI_TEST_DATABASE_URL ??
  process.env.DATABASE_URL ??
  "postgresql://crece:change-me-in-dev@localhost:5432/crece_eval";

export type TestDatabase = { pool: Pool; url: string; drop(): Promise<void> };

export async function createTestDatabase(): Promise<TestDatabase> {
  const name = `crece_ai_test_${randomUUID().replaceAll("-", "").slice(0, 12)}`;
  const admin = new Pool({ connectionString: INTEGRATION_DATABASE_URL, max: 1 });
  await admin.query(`CREATE DATABASE ${name}`);
  const url = new URL(INTEGRATION_DATABASE_URL);
  url.pathname = `/${name}`;
  const pool = createAiPool(url.toString(), 4);
  return {
    pool,
    url: url.toString(),
    async drop() {
      pool.removeAllListeners("error");
      pool.on("error", () => undefined);
      await pool.end();
      await admin.query(`DROP DATABASE IF EXISTS ${name} WITH (FORCE)`);
      await admin.end();
    },
  };
}
