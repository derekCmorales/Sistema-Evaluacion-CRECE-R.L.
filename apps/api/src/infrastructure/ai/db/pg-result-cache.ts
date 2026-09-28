import type { Pool } from "pg";
import type { ResultCache } from "@crece/ai-engine";

export class PgResultCache implements ResultCache {
  constructor(private readonly pool: Pool) {}

  async get<T>(namespace: string, key: string): Promise<T | null> {
    const { rows } = await this.pool.query<{ value: T }>(
      "SELECT value FROM ai.result_cache WHERE namespace = $1 AND key = $2",
      [namespace, key],
    );
    return rows[0]?.value ?? null;
  }

  async put<T>(namespace: string, key: string, value: T): Promise<void> {
    await this.pool.query(
      `INSERT INTO ai.result_cache (namespace, key, value) VALUES ($1, $2, $3)
       ON CONFLICT (namespace, key) DO UPDATE SET value = EXCLUDED.value, created_at = now()`,
      [namespace, key, JSON.stringify(value)],
    );
  }
}
