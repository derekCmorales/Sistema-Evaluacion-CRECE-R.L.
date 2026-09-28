import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { DocumentExtraction } from "@crece/ai-engine";
import { migrateAiSchema } from "./migrator";
import { PgExtractionStore } from "./pg-extraction-store";
import { PgResultCache } from "./pg-result-cache";
import { PgRunStore } from "./pg-run-store";
import { createTestDatabase, type TestDatabase } from "./test-database";

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
    it("idempotencia por (task, idempotency_key) también con carreras", async () => {
      const store = new PgRunStore(db.pool);
      const base = { task: "REVIEW" as const, forced: false, isLab: false, createdAt: new Date().toISOString() };
      const results = await Promise.all(
        [1, 2, 3].map(() => store.createOrGet({ ...base, id: randomUUID(), idempotencyKey: "op-1:review" })),
      );
      expect(results.filter((r) => r.created)).toHaveLength(1);
      expect(new Set(results.map((r) => r.run.id)).size).toBe(1);
    });

    it("éxito y eventos se guardan juntos; se encuentra para reutilizar", async () => {
      const store = new PgRunStore(db.pool);
      const id = randomUUID();
      await store.createOrGet({ id, task: "DRAFT_5C", forced: false, isLab: false, createdAt: new Date().toISOString() });
      await store.markRunning(id, new Date().toISOString());
      await store.markSucceeded(
        id,
        {
          modelId: "gemini-3.8-flash",
          promptVersion: "draft-5c@v1",
          inputSha256: "abc",
          usage: { inputTokens: 5000, cachedInputTokens: 4200, outputTokens: 600, thinkingTokens: 100 },
          costEstimateUsd: 0.0071,
          output: { character: "…" },
        },
        new Date().toISOString(),
        [{ type: "Draft5CReady", runId: id, operationId: "op-1", occurredAt: new Date().toISOString(), lab: false }],
      );
      const run = await store.get(id);
      expect(run).toMatchObject({ status: "SUCCEEDED", costEstimateUsd: 0.0071, usage: { cachedInputTokens: 4200 } });
      const reusable = await store.findReusable({
        task: "DRAFT_5C",
        inputSha256: "abc",
        modelId: "gemini-3.8-flash",
        promptVersion: "draft-5c@v1",
        isLab: false,
      });
      expect(reusable?.id).toBe(id);
      const { rows } = await db.pool.query("SELECT event_type FROM ai.outbox WHERE payload->>'runId' = $1", [id]);
      expect(rows.map((r) => r.event_type)).toEqual(["Draft5CReady"]);
    });

    it("si publicar el evento falla, el cambio de estado se revierte", async () => {
      const store = new PgRunStore(db.pool);
      const id = randomUUID();
      await store.createOrGet({ id, task: "EXTRACT", forced: false, isLab: true, createdAt: new Date().toISOString() });
      const broken = { type: "DocumentExtractionCompleted", toJSON: () => { throw new Error("boom"); } };
      await expect(
        store.markSucceeded(id, {}, new Date().toISOString(), [broken as never]),
      ).rejects.toThrow("boom");
      expect((await store.get(id))?.status).toBe("QUEUED");
    });

    it("registra fallos con código estable y lista por filtros", async () => {
      const store = new PgRunStore(db.pool);
      const id = randomUUID();
      await store.createOrGet({ id, task: "EXTRACT", operationId: "op-9", forced: false, isLab: false, createdAt: new Date().toISOString() });
      await store.markFailed(
        id,
        { errorCode: "AI_PROVIDER_TIMEOUT", errorMessage: "El proveedor no respondió", attempts: 3 },
        new Date().toISOString(),
        [],
      );
      expect(await store.get(id)).toMatchObject({ status: "FAILED", errorCode: "AI_PROVIDER_TIMEOUT", attempts: 3 });
      const listed = await store.list({ operationId: "op-9" });
      expect(listed.map((r) => r.id)).toEqual([id]);
    });
  });

  describe("PgExtractionStore", () => {
    const extraction = (id: string): DocumentExtraction => ({
      id,
      fileSha256: "sha-dpi",
      ocrModel: "mistral-ocr-x",
      documentType: "DPI",
      schemaCode: "DPI",
      schemaVersion: 1,
      pages: [{ index: 1, text: "REPÚBLICA DE GUATEMALA", confidence: 0.97 }],
      candidates: [{ id: "c1", fieldKey: "cui", fieldLabel: "CUI", value: "1234 56789 0101", page: 1, confidence: 0.95, needsAttention: false }],
      images: [{ page: 1, id: "img-0", kind: "ID_PHOTO", relevant: false, description: "Foto del documento" }],
      createdAt: new Date().toISOString(),
      isLab: true,
    });

    it("deduplica por clave y enlaza documentos", async () => {
      const store = new PgExtractionStore(db.pool);
      const first = await store.save(extraction(randomUUID()), { raw: true });
      const second = await store.save(extraction(randomUUID()));
      expect(second.id).toBe(first.id);
      await store.linkDocument("lab/dpi-a.pdf", first.id);
      await store.linkDocument("lab/dpi-b.pdf", first.id, "op-2");
      expect((await store.findByDocumentRef("lab/dpi-b.pdf"))?.candidates[0]?.value).toBe("1234 56789 0101");
      const { rows } = await db.pool.query("SELECT raw_purge_after IS NOT NULL AS has_purge FROM ai.document_extraction WHERE id = $1", [first.id]);
      expect(rows[0].has_purge).toBe(true);
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
});
