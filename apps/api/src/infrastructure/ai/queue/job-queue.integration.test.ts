import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AiJob } from "@crece/ai-engine";
import { migrateAiSchema } from "../db/migrator";
import { PgRunStore } from "../db/pg-run-store";
import { createTestDatabase, type TestDatabase } from "../db/test-database";
import { PgBossJobQueue } from "./pg-boss-job-queue";

async function waitFor(predicate: () => Promise<boolean>, timeoutMs = 20_000): Promise<void> {
  const started = Date.now();
  while (!(await predicate())) {
    if (Date.now() - started > timeoutMs) throw new Error("timeout esperando la condición");
    await new Promise((r) => setTimeout(r, 200));
  }
}

describe("PgBossJobQueue", () => {
  let db: TestDatabase;
  let queue: PgBossJobQueue;

  beforeAll(async () => {
    db = await createTestDatabase();
    await migrateAiSchema(db.pool, 768);
    queue = await PgBossJobQueue.start(db.url);
  });

  afterAll(async () => {
    await queue?.stop();
    await db?.drop();
  });

  it("encola, el worker ejecuta y la ejecución queda SUCCEEDED", async () => {
    const runs = new PgRunStore(db.pool);
    const runId = randomUUID();
    await runs.createOrGet({ id: runId, task: "EXTRACT", forced: false, isLab: true, createdAt: new Date().toISOString() });

    const seen: AiJob[] = [];
    await queue.work(async (job) => {
      seen.push(job);
      await runs.markSucceeded(job.runId, {}, new Date().toISOString(), []);
    }, 2);

    await queue.enqueue({ task: "EXTRACT", runId });
    await queue.enqueue({ task: "EXTRACT", runId }); // duplicado mientras está pendiente

    await waitFor(async () => (await runs.get(runId))?.status === "SUCCEEDED");
    await new Promise((r) => setTimeout(r, 1500));
    expect(seen.filter((j) => j.runId === runId)).toHaveLength(1);
  });

  it("start es idempotente: la cola existente se reutiliza", async () => {
    const second = await PgBossJobQueue.start(db.url);
    await second.stop();
  });
});
