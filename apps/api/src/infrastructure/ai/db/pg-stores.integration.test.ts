import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AiEngineEvent, DocumentExtraction } from "@crece/ai-engine";
import { purgeLabData } from "../lab/pg-lab-purge";
import { migrateAiSchema } from "./migrator";
import { PgExtractionStore } from "./pg-extraction-store";
import { PgOutboxRelay } from "./pg-outbox-relay";
import { PgResultCache } from "./pg-result-cache";
import { PgRunStore } from "./pg-run-store";
import { PgWorkerHeartbeat } from "./pg-worker-heartbeat";
import { createTestDatabase, type TestDatabase } from "./test-database";

const now = () => new Date().toISOString();
const ago = (seconds: number) => new Date(Date.now() - seconds * 1000).toISOString();

const readyEvent = (runId: string): AiEngineEvent => ({
  type: "Draft5CReady",
  eventId: randomUUID(),
  schemaVersion: 1,
  runId,
  operationId: "op-1",
  occurredAt: now(),
  lab: false,
});

describe("stores de Postgres del motor de IA", () => {
  let db: TestDatabase;

  beforeAll(async () => {
    db = await createTestDatabase();
    await migrateAiSchema(db.pool, 768);
  });

  afterAll(async () => {
    await db?.drop();
  });

  describe("PgRunStore", () => {
    const newRun = (overrides: Record<string, unknown> = {}) => ({
      id: randomUUID(),
      task: "EXTRACT" as const,
      forced: false,
      isLab: false,
      createdAt: now(),
      ...overrides,
    });

    it("idempotencia por (task, idempotency_key) también con carreras", async () => {
      const store = new PgRunStore(db.pool);
      const results = await Promise.all(
        [1, 2, 3].map(() => store.createOrGet(newRun({ task: "REVIEW", idempotencyKey: "op-1:review" }))),
      );
      expect(results.filter((r) => r.created)).toHaveLength(1);
      expect(new Set(results.map((r) => r.run.id)).size).toBe(1);
    });

    it("el callback corre en la misma transacción: si falla, la ejecución no existe", async () => {
      const store = new PgRunStore(db.pool);
      const run = newRun({ idempotencyKey: `extract:${randomUUID()}` });
      await expect(
        store.createOrGet(run, async () => {
          throw new Error("cola caída");
        }),
      ).rejects.toThrow("cola caída");
      expect(await store.get(run.id)).toBeNull();
      expect((await store.createOrGet({ ...run, id: randomUUID() })).created).toBe(true);
    });

    it("una FAILED libera la clave; una viva la retiene", async () => {
      const store = new PgRunStore(db.pool);
      const key = `extract:${randomUUID()}`;
      const first = await store.createOrGet(newRun({ idempotencyKey: key }));
      await store.claim(first.run.id, now(), ago(900));
      await store.markFailed(first.run.id, { errorCode: "AI_PROVIDER_TIMEOUT", errorMessage: "x", attempts: 3 }, now(), []);
      const second = await store.createOrGet(newRun({ idempotencyKey: key, retryOf: first.run.id }));
      expect(second).toMatchObject({ created: true, run: { retryOf: first.run.id, status: "QUEUED" } });
      const third = await store.createOrGet(newRun({ idempotencyKey: key }));
      expect(third).toMatchObject({ created: false, run: { id: second.run.id } });
    });

    it("claim es compare-and-set: dos workers a la vez, uno gana; pasado el plazo se retoma", async () => {
      const store = new PgRunStore(db.pool);
      const { run } = await store.createOrGet(newRun());
      const claims = await Promise.all([store.claim(run.id, now(), ago(900)), store.claim(run.id, now(), ago(900))]);
      expect(claims.filter(Boolean)).toHaveLength(1);
      expect(await store.claim(run.id, now(), ago(900))).toBeNull();
      // Con un corte posterior al inicio (plazo vencido), otro worker la retoma.
      expect(await store.claim(run.id, now(), new Date(Date.now() + 1000).toISOString())).not.toBeNull();
    });

    it("éxito y eventos se guardan juntos, solo sobre RUNNING; se encuentra para reutilizar", async () => {
      const store = new PgRunStore(db.pool);
      const { run } = await store.createOrGet(newRun({ task: "DRAFT_5C" }));
      expect(await store.markSucceeded(run.id, {}, now(), [readyEvent(run.id)])).toBe(false); // aún QUEUED
      await store.claim(run.id, now(), ago(900));
      const applied = await store.markSucceeded(
        run.id,
        {
          modelId: "gemini-3.8-flash",
          promptVersion: "draft-5c@v1",
          inputSha256: "abc",
          usage: { inputTokens: 5000, cachedInputTokens: 4200, outputTokens: 600, thinkingTokens: 100 },
          costEstimateUsd: 0.0071,
          output: { character: "…" },
        },
        now(),
        [readyEvent(run.id)],
      );
      expect(applied).toBe(true);
      expect(await store.markFailed(run.id, { errorCode: "AI_INTERNAL", errorMessage: "x", attempts: 0 }, now(), [readyEvent(run.id)])).toBe(false);
      expect(await store.get(run.id)).toMatchObject({ status: "SUCCEEDED", costEstimateUsd: 0.0071, usage: { cachedInputTokens: 4200 } });
      const reusable = await store.findReusable({ task: "DRAFT_5C", inputSha256: "abc", modelId: "gemini-3.8-flash", promptVersion: "draft-5c@v1", isLab: false });
      expect(reusable?.id).toBe(run.id);
      const { rows } = await db.pool.query("SELECT event_type FROM ai.outbox WHERE payload->>'runId' = $1", [run.id]);
      expect(rows.map((r) => r.event_type)).toEqual(["Draft5CReady"]);
    });

    it("si publicar el evento falla, el cambio de estado se revierte", async () => {
      const store = new PgRunStore(db.pool);
      const { run } = await store.createOrGet(newRun({ isLab: true }));
      await store.claim(run.id, now(), ago(900));
      const broken = { type: "DocumentExtractionCompleted", toJSON: () => { throw new Error("boom"); } };
      await expect(store.markSucceeded(run.id, {}, now(), [broken as never])).rejects.toThrow("boom");
      expect((await store.get(run.id))?.status).toBe("RUNNING");
    });

    it("trabadas: se encuentran y se interrumpen solo si siguen igual desde antes del corte", async () => {
      const store = new PgRunStore(db.pool);
      const queued = await store.createOrGet(newRun({ createdAt: ago(7200), operationId: "op-stalled" }));
      const running = await store.createOrGet(newRun({ createdAt: ago(7200) }));
      await store.claim(running.run.id, ago(7000), ago(99999));
      const fresh = await store.createOrGet(newRun());
      const cutoff = ago(3600);
      const stalled = await store.findStalled({ queuedBefore: cutoff, runningBefore: cutoff, limit: 100 });
      const ids = stalled.map((r) => r.id);
      expect(ids).toEqual(expect.arrayContaining([queued.run.id, running.run.id]));
      expect(ids).not.toContain(fresh.run.id);

      const failure = { errorCode: "AI_RUN_INTERRUPTED" as const, errorMessage: "interrumpida", attempts: 0 };
      expect(await store.markInterrupted(queued.run.id, { status: "QUEUED", before: cutoff }, failure, now(), [])).toBe(true);
      expect(await store.markInterrupted(queued.run.id, { status: "QUEUED", before: cutoff }, failure, now(), [])).toBe(false);
      expect(await store.markInterrupted(running.run.id, { status: "RUNNING", before: cutoff }, failure, now(), [])).toBe(true);
      expect(await store.markInterrupted(fresh.run.id, { status: "QUEUED", before: cutoff }, failure, now(), [])).toBe(false);
      expect(await store.get(queued.run.id)).toMatchObject({ status: "FAILED", errorCode: "AI_RUN_INTERRUPTED" });
    });

    it("countActive y listado por filtros", async () => {
      const store = new PgRunStore(db.pool);
      const before = await store.countActive();
      const { run } = await store.createOrGet(newRun({ operationId: "op-count" }));
      const after = await store.countActive();
      expect(after.queued).toBe(before.queued + 1);
      expect(after.oldestQueuedAt).not.toBeNull();
      expect((await store.list({ operationId: "op-count" })).map((r) => r.id)).toEqual([run.id]);
    });
  });

  describe("PgExtractionStore", () => {
    const extraction = (id: string, overrides: Partial<DocumentExtraction> = {}): DocumentExtraction => ({
      id,
      fileSha256: "sha-dpi",
      ocrModel: "mistral-ocr-4-1",
      documentType: "DPI",
      schemaCode: "DPI",
      schemaVersion: 1,
      pipelineFingerprint: "extract-v2:abc",
      injectionSuspected: false,
      pages: [{ index: 1, text: "REPÚBLICA DE GUATEMALA", confidence: 0.97 }],
      candidates: [{ id: "c1", fieldKey: "cui", fieldLabel: "CUI", value: "1234 56789 0101", page: 1, confidence: 0.95, needsAttention: false }],
      images: [{ page: 1, id: "img-0", kind: "ID_PHOTO", relevant: false, description: "Foto del documento" }],
      createdAt: now(),
      isLab: true,
      ...overrides,
    });

    it("deduplica por clave (con lab/producción separados) y enlaza documentos", async () => {
      const store = new PgExtractionStore(db.pool);
      const first = await store.save(extraction(randomUUID()), { raw: true });
      const second = await store.save(extraction(randomUUID()));
      expect(second.id).toBe(first.id);
      const prod = await store.save(extraction(randomUUID(), { isLab: false, injectionSuspected: true }));
      expect(prod.id).not.toBe(first.id);
      expect(prod.injectionSuspected).toBe(true);
      expect((await store.findByKey({ fileSha256: "sha-dpi", ocrModel: "mistral-ocr-4-1", pipelineFingerprint: "extract-v2:abc", isLab: false }))?.id).toBe(prod.id);

      await store.linkDocument("lab/dpi-a.pdf", first.id);
      await store.linkDocument("lab/dpi-b.pdf", first.id, "op-2");
      expect((await store.findByDocumentRef("lab/dpi-b.pdf"))?.candidates[0]?.value).toBe("1234 56789 0101");
      const { rows } = await db.pool.query("SELECT raw_purge_after IS NOT NULL AS has_purge FROM ai.document_extraction WHERE id = $1", [first.id]);
      expect(rows[0].has_purge).toBe(true);
    });

    it("purga la respuesta cruda vencida y conserva lo normalizado", async () => {
      const store = new PgExtractionStore(db.pool, 1);
      const saved = await store.save(extraction(randomUUID(), { fileSha256: "sha-raw" }), { annotation: { cui: "x" } });
      await db.pool.query("UPDATE ai.document_extraction SET raw_purge_after = now() - interval '1 minute' WHERE id = $1", [saved.id]);
      expect(await store.purgeExpiredRawResponses()).toBe(1);
      const { rows } = await db.pool.query("SELECT raw_response, pages FROM ai.document_extraction WHERE id = $1", [saved.id]);
      expect(rows[0].raw_response).toBeNull();
      expect(rows[0].pages).toHaveLength(1);
    });
  });

  describe("PgOutboxRelay", () => {
    it("publica en orden, marca publicados y no los repite", async () => {
      await db.pool.query("DELETE FROM ai.outbox");
      const runs = new PgRunStore(db.pool);
      const { run } = await runs.createOrGet({ id: randomUUID(), task: "DRAFT_5C", forced: false, isLab: false, createdAt: now() });
      await runs.claim(run.id, now(), ago(900));
      await runs.markSucceeded(run.id, {}, now(), [readyEvent(run.id), readyEvent(run.id)]);
      const relay = new PgOutboxRelay(db.pool);
      const seen: string[] = [];
      expect(await relay.drain(async (e) => void seen.push(e.eventId))).toEqual({ published: 2, failed: 0, dead: 0 });
      expect(await relay.drain(async (e) => void seen.push(e.eventId))).toEqual({ published: 0, failed: 0, dead: 0 });
      expect(seen).toHaveLength(2);
    });

    it("un consumidor que falla se reintenta y, agotados los intentos, el evento se descarta sin bloquear", async () => {
      await db.pool.query("DELETE FROM ai.outbox");
      await db.pool.query("INSERT INTO ai.outbox (event_type, payload) VALUES ('Draft5CReady', $1), ('Draft5CReady', $2)", [
        JSON.stringify(readyEvent("r-poison")),
        JSON.stringify(readyEvent("r-ok")),
      ]);
      const relay = new PgOutboxRelay(db.pool, 2);
      const publish = async (event: AiEngineEvent) => {
        if (event.runId === "r-poison") throw new Error("consumidor caído");
      };
      expect(await relay.drain(publish)).toEqual({ published: 1, failed: 1, dead: 0 });
      expect(await relay.drain(publish)).toEqual({ published: 0, failed: 0, dead: 1 });
      const { rows } = await db.pool.query("SELECT attempts, last_error, dead_at IS NOT NULL AS dead FROM ai.outbox WHERE payload->>'runId' = 'r-poison'");
      expect(rows[0]).toEqual({ attempts: 2, last_error: "consumidor caído", dead: true });
    });

    it("un payload que no cumple el contrato vigente se descarta", async () => {
      await db.pool.query("DELETE FROM ai.outbox");
      await db.pool.query("INSERT INTO ai.outbox (event_type, payload) VALUES ('Draft5CReady', '{\"type\":\"Draft5CReady\"}')");
      expect(await new PgOutboxRelay(db.pool).drain(async () => undefined)).toEqual({ published: 0, failed: 0, dead: 1 });
    });

    it("dos relays a la vez no entregan el mismo evento dos veces", async () => {
      await db.pool.query("DELETE FROM ai.outbox");
      for (let i = 0; i < 10; i += 1) {
        await db.pool.query("INSERT INTO ai.outbox (event_type, payload) VALUES ('Draft5CReady', $1)", [JSON.stringify(readyEvent(`r-${i}`))]);
      }
      const seen: string[] = [];
      const slow = async (e: AiEngineEvent) => {
        seen.push(e.eventId);
        await new Promise((r) => setTimeout(r, 20));
      };
      await Promise.all([new PgOutboxRelay(db.pool).drain(slow, 10), new PgOutboxRelay(db.pool).drain(slow, 10)]);
      expect(seen).toHaveLength(10);
      expect(new Set(seen).size).toBe(10);
    });
  });

  describe("PgWorkerHeartbeat", () => {
    it("registra workers vivos y los da de baja al retirarse", async () => {
      const heartbeat = new PgWorkerHeartbeat(db.pool, `test:${randomUUID()}`, 2);
      await heartbeat.beat();
      expect((await PgWorkerHeartbeat.online(db.pool, 45)).workers).toBeGreaterThanOrEqual(1);
      await heartbeat.retire();
      await heartbeat.beat(new Date(Date.now() - 120_000));
      const stale = await PgWorkerHeartbeat.online(db.pool, 45);
      expect(stale.workers).toBe(0);
      expect(stale.lastSeenAt).not.toBeNull();
      await heartbeat.retire();
    });
  });

  describe("retención del laboratorio", () => {
    it("borra solo filas de lab vencidas y nunca producción ni ejecuciones en curso", async () => {
      const runs = new PgRunStore(db.pool);
      const oldLab = await runs.createOrGet({ id: randomUUID(), task: "EXTRACT", forced: false, isLab: true, createdAt: ago(10 * 86400) });
      await runs.claim(oldLab.run.id, now(), ago(900));
      await runs.markFailed(oldLab.run.id, { errorCode: "AI_INTERNAL", errorMessage: "x", attempts: 0 }, now(), []);
      const oldLabRunning = await runs.createOrGet({ id: randomUUID(), task: "EXTRACT", forced: false, isLab: true, createdAt: ago(10 * 86400) });
      const oldProd = await runs.createOrGet({ id: randomUUID(), task: "EXTRACT", forced: false, isLab: false, createdAt: ago(10 * 86400) });
      const recentLab = await runs.createOrGet({ id: randomUUID(), task: "EXTRACT", forced: false, isLab: true, createdAt: now() });

      const result = await purgeLabData(db.pool, 7);
      expect(result.runs).toBeGreaterThanOrEqual(1);
      expect(await runs.get(oldLab.run.id)).toBeNull();
      expect(await runs.get(oldLabRunning.run.id)).not.toBeNull();
      expect(await runs.get(oldProd.run.id)).not.toBeNull();
      expect(await runs.get(recentLab.run.id)).not.toBeNull();
    });
  });

  describe("PgResultCache", () => {
    it("guarda y reemplaza por namespace y clave", async () => {
      const cache = new PgResultCache(db.pool);
      expect(await cache.get("query-embedding", "k")).toBeNull();
      await cache.put("query-embedding", "k", [0.1, 0.2]);
      await cache.put("query-embedding", "k", [0.3]);
      expect(await cache.get<number[]>("query-embedding", "k")).toEqual([0.3]);
    });
  });

  it("los parsers numéricos son del pool del motor, no globales de pg", async () => {
    const { rows: ai } = await db.pool.query("SELECT 12345.67::numeric AS n");
    expect(ai[0].n).toBe(12345.67);
    const other = new Pool({ connectionString: db.url, max: 1 });
    try {
      const { rows } = await other.query("SELECT 12345.67::numeric AS n");
      expect(rows[0].n).toBe("12345.67");
    } finally {
      await other.end();
    }
  });
});
