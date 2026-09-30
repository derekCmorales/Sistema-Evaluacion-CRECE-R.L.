import type { Pool } from "pg";
import { inTransaction } from "../db/pg-transaction";

export type LabPurgeResult = { runs: number; extractions: number; sources: number; events: number };

/**
 * Retención del laboratorio en la base (design D12): borra solo filas marcadas `is_lab` (y
 * eventos de lab) más viejas que el corte. Nunca toca datos de producción. Las ejecuciones en
 * curso no se borran.
 */
export async function purgeLabData(pool: Pool, olderThanDays: number): Promise<LabPurgeResult> {
  return inTransaction(pool, async (client) => {
    const cutoff = `now() - make_interval(days => $1)`;
    const runs = await client.query(
      `DELETE FROM ai.ai_run WHERE is_lab AND created_at < ${cutoff} AND status NOT IN ('QUEUED', 'RUNNING')`,
      [olderThanDays],
    );
    const extractions = await client.query(`DELETE FROM ai.document_extraction WHERE is_lab AND created_at < ${cutoff}`, [olderThanDays]);
    const sources = await client.query(`DELETE FROM ai.knowledge_source WHERE is_lab AND created_at < ${cutoff}`, [olderThanDays]);
    const events = await client.query(
      `DELETE FROM ai.outbox WHERE (payload->>'lab')::boolean AND created_at < ${cutoff}`,
      [olderThanDays],
    );
    return {
      runs: runs.rowCount ?? 0,
      extractions: extractions.rowCount ?? 0,
      sources: sources.rowCount ?? 0,
      events: events.rowCount ?? 0,
    };
  });
}
