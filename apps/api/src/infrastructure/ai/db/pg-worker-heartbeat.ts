import type { Pool } from "pg";

/**
 * Latido de los procesos worker: permite saber si hay quien consuma la cola (la API y el lab
 * avisan "el worker no está corriendo" en vez de dejar una ejecución "en cola" sin explicación).
 */
export class PgWorkerHeartbeat {
  constructor(
    private readonly pool: Pool,
    readonly workerId: string,
    private readonly concurrency: number,
  ) {}

  async beat(at = new Date()): Promise<void> {
    await this.pool.query(
      `INSERT INTO ai.worker_heartbeat (worker_id, started_at, last_seen_at, concurrency) VALUES ($1, $2, $2, $3)
       ON CONFLICT (worker_id) DO UPDATE SET last_seen_at = EXCLUDED.last_seen_at, concurrency = EXCLUDED.concurrency`,
      [this.workerId, at.toISOString(), this.concurrency],
    );
  }

  /** Al apagarse con orden, el worker se da de baja. */
  async retire(): Promise<void> {
    await this.pool.query("DELETE FROM ai.worker_heartbeat WHERE worker_id = $1", [this.workerId]);
  }

  /** Workers con latido en los últimos `withinSeconds` segundos; limpia los muy viejos. */
  static async online(pool: Pool, withinSeconds: number): Promise<{ workers: number; lastSeenAt: string | null }> {
    await pool.query("DELETE FROM ai.worker_heartbeat WHERE last_seen_at < now() - interval '1 day'");
    const { rows } = await pool.query<{ workers: number; last_seen: Date | null }>(
      `SELECT count(*) FILTER (WHERE last_seen_at >= now() - make_interval(secs => $1))::int AS workers,
              max(last_seen_at) AS last_seen
       FROM ai.worker_heartbeat`,
      [withinSeconds],
    );
    const row = rows[0]!;
    return { workers: row.workers, lastSeenAt: row.last_seen ? row.last_seen.toISOString() : null };
  }
}
