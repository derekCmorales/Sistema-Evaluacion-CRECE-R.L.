import type { Pool } from "pg";
import { AiEngineEventSchema, type AiEngineEvent } from "@crece/ai-engine";
import { inTransaction } from "./pg-transaction";

export type RelayResult = { published: number; failed: number; dead: number };

type OutboxRow = { id: number; payload: unknown; attempts: number };

/**
 * Publica los eventos del outbox (design D2). Entrega "al menos una vez": el consumidor deduplica
 * por `eventId`. Varias instancias pueden drenar a la vez (`FOR UPDATE SKIP LOCKED`). Un evento
 * cuyo consumidor falla se reintenta en la siguiente pasada; tras `maxAttempts` queda descartado
 * (`dead_at`) para no bloquear a los demás, y se registra.
 */
export class PgOutboxRelay {
  constructor(
    private readonly pool: Pool,
    private readonly maxAttempts = 10,
  ) {}

  async drain(publish: (event: AiEngineEvent) => Promise<void>, limit = 20): Promise<RelayResult> {
    return inTransaction(this.pool, async (client) => {
      const { rows } = await client.query<OutboxRow>(
        `SELECT id, payload, attempts FROM ai.outbox
         WHERE published_at IS NULL AND dead_at IS NULL
         ORDER BY id LIMIT $1 FOR UPDATE SKIP LOCKED`,
        [limit],
      );
      const result: RelayResult = { published: 0, failed: 0, dead: 0 };
      for (const row of rows) {
        const parsed = AiEngineEventSchema.safeParse(row.payload);
        if (!parsed.success) {
          await client.query("UPDATE ai.outbox SET dead_at = now(), last_error = $2 WHERE id = $1", [
            row.id,
            "Evento con formato inválido para el contrato vigente",
          ]);
          result.dead += 1;
          continue;
        }
        try {
          await publish(parsed.data);
          await client.query("UPDATE ai.outbox SET published_at = now() WHERE id = $1", [row.id]);
          result.published += 1;
        } catch (error) {
          const attempts = row.attempts + 1;
          const message = (error instanceof Error ? error.message : String(error)).slice(0, 500);
          const dead = attempts >= this.maxAttempts;
          await client.query(
            `UPDATE ai.outbox SET attempts = $2, last_error = $3, dead_at = CASE WHEN $4 THEN now() ELSE NULL END WHERE id = $1`,
            [row.id, attempts, message, dead],
          );
          if (dead) result.dead += 1;
          else result.failed += 1;
        }
      }
      return result;
    });
  }
}
