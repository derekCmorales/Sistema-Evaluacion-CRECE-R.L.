import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AiJob } from "@crece/ai-engine";
import { migrateAiSchema } from "../db/migrator";
import { PgRunStore } from "../db/pg-run-store";
import { createTestDatabase, type TestDatabase } from "../db/test-database";
import { AI_RUNS_QUEUE, PgBossJobQueue } from "./pg-boss-job-queue";

async function waitFor(predicate: () => Promise<boolean>, timeoutMs = 20_000): Promise<void> {
  const started = Date.now();
  while (!(await predicate())) {
    if (Date.now() - started > timeoutMs) throw new Error("timeout esperando la condición");
    await new Promise((r) => setTimeout(r, 200));
  }
}

const countJobs = async (db: TestDatabase, runId: string) =>
  (await db.pool.query("SELECT count(*)::int AS n FROM ai_jobs.job WHERE name = $1 AND id = $2", [AI_RUNS_QUEUE, runId])).rows[0].n as number;

describe("PgBossJobQueue", () => {
  let db: TestDatabase;
  let producer: PgBossJobQueue;
  let worker: PgBossJobQueue;

  beforeAll(async () => {
    db = await createTestDatabase();
    await migrateAiSchema(db.pool, 768);
    producer = await PgBossJobQueue.start(db.url, { role: "producer", expireInSeconds: 900 });
    worker = await PgBossJobQueue.start(db.url, { role: "worker", expireInSeconds: 900 });
  });

  afterAll(async () => {
    await producer?.stop();
    await worker?.stop();
    await db?.drop();
  });

  it("crear la ejecución y encolar se confirman juntos; el worker la ejecuta una sola vez", async () => {
    const runs = new PgRunStore(db.pool);
    const runId = randomUUID();
    const seen: AiJob[] = [];
    await worker.work(async (job) => {
      seen.push(job);
      await runs.claim(job.runId, new Date().toISOString(), new Date(Date.now() - 900_000).toISOString());
      await runs.markSucceeded(job.runId, {}, new Date().toISOString(), []);
    }, 2);

    await runs.createOrGet(
      { id: runId, task: "EXTRACT", forced: false, isLab: true, createdAt: new Date().toISOString() },
      (tx) => producer.enqueue({ task: "EXTRACT", runId }, tx),
    );
    await producer.enqueue({ task: "EXTRACT", runId }); // duplicado: mismo id, no se inserta otro

    await waitFor(async () => (await runs.get(runId))?.status === "SUCCEEDED");
    await new Promise((r) => setTimeout(r, 1500));
    expect(seen.filter((j) => j.runId === runId)).toHaveLength(1);
  });

  it("si la transacción se revierte, tampoco queda el trabajo en la cola", async () => {
    const runs = new PgRunStore(db.pool);
    const runId = randomUUID();
    await expect(
      runs.createOrGet({ id: runId, task: "EXTRACT", forced: false, isLab: true, createdAt: new Date().toISOString() }, async (tx) => {
        await producer.enqueue({ task: "EXTRACT", runId }, tx);
        throw new Error("falla después de encolar");
      }),
    ).rejects.toThrow("falla después de encolar");
    expect(await runs.get(runId)).toBeNull();
    expect(await countJobs(db, runId)).toBe(0);
  });

  it("start es idempotente: la cola existente se reutiliza y toma el plazo vigente", async () => {
    const second = await PgBossJobQueue.start(db.url, { role: "producer", expireInSeconds: 600 });
    await second.stop();
    const { rows } = await db.pool.query("SELECT expire_seconds FROM ai_jobs.queue WHERE name = $1", [AI_RUNS_QUEUE]);
    expect(rows[0].expire_seconds).toBe(600);
  });
});
