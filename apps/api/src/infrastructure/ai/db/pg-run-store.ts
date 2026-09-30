import type { Pool, PoolClient } from "pg";
import type {
  AiEngineEvent,
  AiRun,
  NewAiRun,
  RunFailure,
  RunFilter,
  RunStore,
  RunSuccessPatch,
  StalledRunsQuery,
  Transaction,
} from "@crece/ai-engine";
import { asTransaction, inTransaction } from "./pg-transaction";

type RunRow = {
  id: string;
  task: AiRun["task"];
  idempotency_key: string | null;
  operation_id: string | null;
  document_ref: string | null;
  status: AiRun["status"];
  model_id: string | null;
  prompt_version: string | null;
  input_sha256: string | null;
  retrieved_chunk_ids: string[];
  usage: AiRun["usage"];
  cost_estimate_usd: number | null;
  latency_ms: number | null;
  guard_report: unknown;
  output: unknown;
  error_code: AiRun["errorCode"] | null;
  error_message: string | null;
  requested_by: string | null;
  forced: boolean;
  is_lab: boolean;
  retry_of: string | null;
  attempts: number;
  input: unknown;
  created_at: Date;
  started_at: Date | null;
  finished_at: Date | null;
};

const iso = (d: Date | null) => (d ? d.toISOString() : undefined);
const opt = <T>(v: T | null) => (v === null ? undefined : v);

function toRun(row: RunRow): AiRun {
  return {
    id: row.id,
    task: row.task,
    idempotencyKey: opt(row.idempotency_key),
    operationId: opt(row.operation_id),
    documentRef: opt(row.document_ref),
    status: row.status,
    modelId: opt(row.model_id),
    promptVersion: opt(row.prompt_version),
    inputSha256: opt(row.input_sha256),
    retrievedChunkIds: row.retrieved_chunk_ids,
    usage: row.usage,
    costEstimateUsd: opt(row.cost_estimate_usd),
    latencyMs: opt(row.latency_ms),
    guardReport: opt(row.guard_report),
    output: opt(row.output),
    errorCode: opt(row.error_code),
    errorMessage: opt(row.error_message),
    requestedBy: opt(row.requested_by),
    forced: row.forced,
    isLab: row.is_lab,
    retryOf: opt(row.retry_of),
    attempts: row.attempts,
    input: opt(row.input),
    createdAt: row.created_at.toISOString(),
    startedAt: iso(row.started_at),
    finishedAt: iso(row.finished_at),
  };
}

const json = (v: unknown) => (v === undefined ? null : JSON.stringify(v));

async function insertEvents(client: PoolClient, events: AiEngineEvent[]): Promise<void> {
  for (const event of events) {
    await client.query("INSERT INTO ai.outbox (event_type, payload) VALUES ($1, $2)", [event.type, JSON.stringify(event)]);
  }
}

const FAILURE_SET = `status = 'FAILED', error_code = $2, error_message = $3, attempts = $4,
  latency_ms = COALESCE($5, latency_ms), usage = COALESCE($6, usage),
  guard_report = COALESCE($7, guard_report), finished_at = $8`;

const failureParams = (id: string, failure: RunFailure, at: string) => [
  id,
  failure.errorCode,
  failure.errorMessage,
  failure.attempts,
  failure.latencyMs ?? null,
  json(failure.usage),
  json(failure.guardReport),
  at,
];

export class PgRunStore implements RunStore {
  constructor(private readonly pool: Pool) {}

  async createOrGet(run: NewAiRun, onCreated?: (tx: Transaction) => Promise<void>): Promise<{ run: AiRun; created: boolean }> {
    return inTransaction(this.pool, async (client) => {
      const { rows } = await client.query<RunRow>(
        `INSERT INTO ai.ai_run (id, task, idempotency_key, operation_id, document_ref, status, requested_by, forced, is_lab, retry_of, input, created_at)
         VALUES ($1, $2, $3, $4, $5, 'QUEUED', $6, $7, $8, $9, $10, $11)
         ON CONFLICT (task, idempotency_key) WHERE idempotency_key IS NOT NULL AND status <> 'FAILED' DO NOTHING
         RETURNING *`,
        [
          run.id,
          run.task,
          run.idempotencyKey ?? null,
          run.operationId ?? null,
          run.documentRef ?? null,
          run.requestedBy ?? null,
          run.forced,
          run.isLab,
          run.retryOf ?? null,
          json(run.input),
          run.createdAt,
        ],
      );
      if (rows[0]) {
        await onCreated?.(asTransaction(client));
        return { run: toRun(rows[0]), created: true };
      }
      const existing = await client.query<RunRow>(
        "SELECT * FROM ai.ai_run WHERE task = $1 AND idempotency_key = $2 AND status <> 'FAILED'",
        [run.task, run.idempotencyKey],
      );
      return { run: toRun(existing.rows[0]!), created: false };
    });
  }

  async get(id: string): Promise<AiRun | null> {
    const { rows } = await this.pool.query<RunRow>("SELECT * FROM ai.ai_run WHERE id = $1", [id]);
    return rows[0] ? toRun(rows[0]) : null;
  }

  async claim(id: string, at: string, staleBefore: string): Promise<AiRun | null> {
    const { rows } = await this.pool.query<RunRow>(
      `UPDATE ai.ai_run SET status = 'RUNNING', started_at = $2
       WHERE id = $1 AND (status = 'QUEUED' OR (status = 'RUNNING' AND started_at < $3))
       RETURNING *`,
      [id, at, staleBefore],
    );
    return rows[0] ? toRun(rows[0]) : null;
  }

  async markSucceeded(id: string, patch: RunSuccessPatch, at: string, events: AiEngineEvent[]): Promise<boolean> {
    return inTransaction(this.pool, async (client) => {
      const { rowCount } = await client.query(
        `UPDATE ai.ai_run SET
           status = $2,
           model_id = COALESCE($3, model_id),
           prompt_version = COALESCE($4, prompt_version),
           input_sha256 = COALESCE($5, input_sha256),
           retrieved_chunk_ids = COALESCE($6, retrieved_chunk_ids),
           usage = COALESCE($7, usage),
           cost_estimate_usd = COALESCE($8, cost_estimate_usd),
           latency_ms = COALESCE($9, latency_ms),
           guard_report = COALESCE($10, guard_report),
           output = COALESCE($11, output),
           attempts = COALESCE($12, attempts),
           finished_at = $13
         WHERE id = $1 AND status = 'RUNNING'`,
        [
          id,
          patch.status ?? "SUCCEEDED",
          patch.modelId ?? null,
          patch.promptVersion ?? null,
          patch.inputSha256 ?? null,
          patch.retrievedChunkIds ?? null,
          json(patch.usage),
          patch.costEstimateUsd ?? null,
          patch.latencyMs ?? null,
          json(patch.guardReport),
          json(patch.output),
          patch.attempts ?? null,
          at,
        ],
      );
      if (!rowCount) return false;
      await insertEvents(client, events);
      return true;
    });
  }

  async markFailed(id: string, failure: RunFailure, at: string, events: AiEngineEvent[]): Promise<boolean> {
    return inTransaction(this.pool, async (client) => {
      const { rowCount } = await client.query(
        `UPDATE ai.ai_run SET ${FAILURE_SET} WHERE id = $1 AND status = 'RUNNING'`,
        failureParams(id, failure, at),
      );
      if (!rowCount) return false;
      await insertEvents(client, events);
      return true;
    });
  }

  async markInterrupted(
    id: string,
    expected: { status: "QUEUED" | "RUNNING"; before: string },
    failure: RunFailure,
    at: string,
    events: AiEngineEvent[],
  ): Promise<boolean> {
    const since = expected.status === "QUEUED" ? "created_at" : "started_at";
    return inTransaction(this.pool, async (client) => {
      const { rowCount } = await client.query(
        `UPDATE ai.ai_run SET ${FAILURE_SET} WHERE id = $1 AND status = $9 AND ${since} < $10`,
        [...failureParams(id, failure, at), expected.status, expected.before],
      );
      if (!rowCount) return false;
      await insertEvents(client, events);
      return true;
    });
  }

  async findStalled(q: StalledRunsQuery): Promise<AiRun[]> {
    const { rows } = await this.pool.query<RunRow>(
      `SELECT * FROM ai.ai_run
       WHERE (status = 'QUEUED' AND created_at < $1) OR (status = 'RUNNING' AND started_at < $2)
       ORDER BY created_at LIMIT $3`,
      [q.queuedBefore, q.runningBefore, q.limit],
    );
    return rows.map(toRun);
  }

  async countActive(): Promise<{ queued: number; running: number; oldestQueuedAt: string | null }> {
    const { rows } = await this.pool.query<{ queued: number; running: number; oldest: Date | null }>(
      `SELECT count(*) FILTER (WHERE status = 'QUEUED')::int AS queued,
              count(*) FILTER (WHERE status = 'RUNNING')::int AS running,
              min(created_at) FILTER (WHERE status = 'QUEUED') AS oldest
       FROM ai.ai_run WHERE status IN ('QUEUED', 'RUNNING')`,
    );
    const row = rows[0]!;
    return { queued: row.queued, running: row.running, oldestQueuedAt: row.oldest ? row.oldest.toISOString() : null };
  }

  async findReusable(q: {
    task: AiRun["task"];
    inputSha256: string;
    modelId: string;
    promptVersion: string;
    isLab: boolean;
  }): Promise<AiRun | null> {
    const { rows } = await this.pool.query<RunRow>(
      `SELECT * FROM ai.ai_run
       WHERE status = 'SUCCEEDED' AND task = $1 AND input_sha256 = $2 AND model_id = $3 AND prompt_version = $4 AND is_lab = $5
       ORDER BY finished_at DESC LIMIT 1`,
      [q.task, q.inputSha256, q.modelId, q.promptVersion, q.isLab],
    );
    return rows[0] ? toRun(rows[0]) : null;
  }

  async list(filter: RunFilter): Promise<AiRun[]> {
    const { rows } = await this.pool.query<RunRow>(
      `SELECT * FROM ai.ai_run
       WHERE ($1::text IS NULL OR operation_id = $1)
         AND ($2::text IS NULL OR task = $2)
         AND ($3::boolean IS NULL OR is_lab = $3)
       ORDER BY created_at DESC LIMIT $4`,
      [filter.operationId ?? null, filter.task ?? null, filter.isLab ?? null, filter.limit ?? 50],
    );
    return rows.map(toRun);
  }
}
