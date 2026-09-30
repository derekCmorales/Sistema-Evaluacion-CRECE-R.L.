import { beforeEach, describe, expect, it } from "vitest";
import { AiEngineError } from "../contracts/errors";
import type { OcrDocument } from "../contracts/ocr";
import { resolveAiEngineConfig } from "../config/engine-config";
import { createAiEngine } from "../engine";
import { createDisabledAiEngine } from "../engine-api";
import {
  FakeHasher,
  FakeOcrProvider,
  FixedClock,
  InMemoryDocumentSource,
  InMemoryExtractionStore,
  InMemoryJobQueue,
  InMemoryRunStore,
  RecordingDelay,
  SequentialIdGenerator,
  advisorRequester,
  councilRequester,
  syntheticPdf,
} from "../testing";

const receiptOcr: OcrDocument = {
  model: "mistral-ocr-4-1",
  usage: { pagesProcessed: 1 },
  annotation: { amount: "Q9,800.00", period: "julio 2026" },
  pages: [{ index: 1, markdown: "Periodo: julio 2026\nIngresos del periodo: Q9,800.00", blocks: [], images: [], confidence: 0.95 }],
};

const timeout = () => new AiEngineError("AI_PROVIDER_TIMEOUT", "El proveedor no respondió");

function setup() {
  const clock = new FixedClock("2026-09-30T10:00:00.000Z");
  const runs = new InMemoryRunStore();
  const jobs = new InMemoryJobQueue();
  const documents = new InMemoryDocumentSource();
  const ocr = new FakeOcrProvider("mistral-ocr-4-1", receiptOcr);
  const config = resolveAiEngineConfig({ extraction: { maxAttempts: 1, backoffMs: [0] } });
  const engine = createAiEngine({
    runs,
    extractions: new InMemoryExtractionStore(),
    jobs,
    documents,
    ocr,
    clock,
    ids: new SequentialIdGenerator("id"),
    hasher: new FakeHasher(),
    delay: new RecordingDelay(),
    config,
  });
  documents.put({ ref: "doc-1", fileName: "recibo.pdf", mimeType: "application/pdf", bytes: syntheticPdf([["Periodo: julio 2026"]]) });
  const runAll = () => jobs.drain((job) => engine.executeRun(job.runId));
  return { clock, runs, jobs, documents, ocr, config, engine, runAll };
}

describe("ciclo de vida de una ejecución", () => {
  let ctx: ReturnType<typeof setup>;
  beforeEach(() => {
    ctx = setup();
  });

  describe("reclamo (compare-and-set con plazo)", () => {
    it("dos workers con el mismo trabajo: solo uno llama al proveedor", async () => {
      const { runId } = await ctx.engine.extractDocument({ documentRef: "doc-1", documentType: "INCOME_RECEIPT", requestedBy: advisorRequester });
      await Promise.all([ctx.engine.executeRun(runId), ctx.engine.executeRun(runId)]);
      expect(ctx.ocr.calls).toHaveLength(1);
      expect(ctx.runs.events).toHaveLength(1);
    });

    it("un worker que murió a mitad: otro retoma la ejecución solo pasado el plazo", async () => {
      const { runId } = await ctx.engine.extractDocument({ documentRef: "doc-1", documentType: "INCOME_RECEIPT", requestedBy: advisorRequester });
      await ctx.runs.claim(runId, ctx.clock.now().toISOString(), "2000-01-01T00:00:00.000Z"); // worker A la toma y muere
      await ctx.engine.executeRun(runId);
      expect(ctx.ocr.calls).toHaveLength(0);
      ctx.clock.advance((ctx.config.runs.leaseSeconds + 1) * 1000);
      await ctx.engine.executeRun(runId);
      expect(ctx.ocr.calls).toHaveLength(1);
      expect((await ctx.engine.getRun(runId))?.status).toBe("SUCCEEDED");
    });

    it("una tarea que el motor aún no implementa falla sin reintento automático", async () => {
      await ctx.runs.createOrGet({ id: "r-review", task: "REVIEW", forced: false, isLab: false, createdAt: ctx.clock.now().toISOString(), operationId: "op-1" });
      await ctx.engine.executeRun("r-review");
      expect(await ctx.engine.getRun("r-review")).toMatchObject({ status: "FAILED", errorCode: "AI_TASK_UNAVAILABLE" });
      expect(ctx.runs.events[0]).toMatchObject({ type: "AiRunFailed", task: "REVIEW", operationId: "op-1", retryable: false });
    });

    it("una entrada guardada ilegible es un error interno, no del proveedor", async () => {
      await ctx.runs.createOrGet({ id: "r-bad", task: "EXTRACT", forced: false, isLab: false, createdAt: ctx.clock.now().toISOString(), input: { foo: 1 } });
      await ctx.engine.executeRun("r-bad");
      expect(await ctx.engine.getRun("r-bad")).toMatchObject({ status: "FAILED", errorCode: "AI_INTERNAL" });
    });
  });

  describe("retryRun", () => {
    it("crea una ejecución nueva con la misma entrada, enlazada a la fallida", async () => {
      ctx.ocr.script("recibo.pdf", timeout(), receiptOcr);
      const first = await ctx.engine.extractDocument({ documentRef: "doc-1", documentType: "INCOME_RECEIPT", operationId: "op-1", requestedBy: advisorRequester });
      await ctx.runAll();
      expect((await ctx.engine.getRun(first.runId))?.status).toBe("FAILED");

      const retried = await ctx.engine.retryRun({ runId: first.runId, requestedBy: advisorRequester });
      expect(retried).toMatchObject({ status: "QUEUED", reused: false });
      expect(await ctx.engine.getRun(retried.runId)).toMatchObject({
        retryOf: first.runId,
        documentRef: "doc-1",
        operationId: "op-1",
        idempotencyKey: "extract:doc-1",
      });
      await ctx.runAll();
      expect((await ctx.engine.getRun(retried.runId))?.status).toBe("SUCCEEDED");
      expect((await ctx.engine.getRun(first.runId))?.status).toBe("FAILED"); // historial intacto
    });

    it("doble clic en reintentar: una sola ejecución nueva", async () => {
      ctx.ocr.script("recibo.pdf", timeout());
      const first = await ctx.engine.extractDocument({ documentRef: "doc-1", documentType: "INCOME_RECEIPT", requestedBy: advisorRequester });
      await ctx.runAll();
      const a = await ctx.engine.retryRun({ runId: first.runId, requestedBy: advisorRequester });
      const b = await ctx.engine.retryRun({ runId: first.runId, requestedBy: advisorRequester });
      expect(b).toMatchObject({ runId: a.runId, reused: true });
    });

    it("solo reintenta ejecuciones fallidas, existentes, y con un cargo que opera", async () => {
      const ok = await ctx.engine.extractDocument({ documentRef: "doc-1", documentType: "INCOME_RECEIPT", requestedBy: advisorRequester });
      await ctx.runAll();
      await expect(ctx.engine.retryRun({ runId: ok.runId, requestedBy: advisorRequester })).rejects.toMatchObject({ code: "VALIDATION" });
      await expect(ctx.engine.retryRun({ runId: "no-existe", requestedBy: advisorRequester })).rejects.toMatchObject({ code: "AI_NOT_FOUND" });
      await expect(ctx.engine.retryRun({ runId: ok.runId, requestedBy: councilRequester })).rejects.toMatchObject({ code: "AI_FORBIDDEN" });
    });
  });

  describe("recoverStalledRuns", () => {
    it("marca FAILED (reintentable) lo que quedó en cola o en curso más allá del plazo, con su evento", async () => {
      const queued = await ctx.engine.extractDocument({ documentRef: "doc-1", documentType: "INCOME_RECEIPT", operationId: "op-1", requestedBy: advisorRequester });
      ctx.documents.put({ ref: "doc-2", fileName: "otro.pdf", mimeType: "application/pdf", bytes: syntheticPdf([["x"]]) });
      const running = await ctx.engine.extractDocument({ documentRef: "doc-2", documentType: "OTHER", requestedBy: advisorRequester });
      await ctx.runs.claim(running.runId, ctx.clock.now().toISOString(), "2000-01-01T00:00:00.000Z");

      expect(await ctx.engine.recoverStalledRuns()).toEqual({ interrupted: 0 });
      ctx.clock.advance((ctx.config.runs.stalledAfterSeconds + 1) * 1000);
      const fresh = await ctx.engine.extractDocument({ documentRef: "doc-3", documentType: "OTHER", requestedBy: advisorRequester });

      expect(await ctx.engine.recoverStalledRuns()).toEqual({ interrupted: 2 });
      for (const id of [queued.runId, running.runId]) {
        expect(await ctx.engine.getRun(id)).toMatchObject({ status: "FAILED", errorCode: "AI_RUN_INTERRUPTED" });
      }
      expect((await ctx.engine.getRun(fresh.runId))?.status).toBe("QUEUED");
      expect(ctx.runs.events).toEqual([
        expect.objectContaining({ type: "AiRunFailed", runId: queued.runId, operationId: "op-1", errorCode: "AI_RUN_INTERRUPTED", retryable: true }),
        expect.objectContaining({ type: "AiRunFailed", runId: running.runId, retryable: true }),
      ]);

      // El trabajo viejo que llegue tarde ya no hace nada, y la interrumpida se puede reintentar.
      await ctx.engine.executeRun(queued.runId);
      expect(ctx.ocr.calls).toHaveLength(0);
      const retried = await ctx.engine.retryRun({ runId: queued.runId, requestedBy: advisorRequester });
      expect(retried.reused).toBe(false);
    });
  });

  describe("hechos del anfitrión", () => {
    const uploaded = {
      type: "DocumentUploaded" as const,
      documentAssetId: "doc-1",
      operationId: "op-7",
      checklistCode: "INCOME",
      documentType: "INCOME_RECEIPT" as const,
      uploadedBy: "asesor-7",
      occurredAt: "2026-09-30T10:00:00.000Z",
    };

    it("DocumentUploaded dispara la extracción, idempotente ante la reentrega del hecho", async () => {
      const first = await ctx.engine.handle(uploaded);
      const again = await ctx.engine.handle(uploaded);
      expect(first).toMatchObject({ status: "QUEUED", reused: false });
      expect(again).toMatchObject({ runId: first!.runId, reused: true });
      expect(await ctx.engine.getRun(first!.runId)).toMatchObject({ requestedBy: "asesor-7", operationId: "op-7", isLab: false });
      await ctx.runAll();
      expect((await ctx.engine.getExtractionByDocumentRef("doc-1"))?.candidates.map((c) => c.fieldKey)).toEqual(["period", "amount"]);
    });

    it("hechos que todavía no disparan trabajo devuelven null; un hecho mal formado es error de validación", async () => {
      expect(
        await ctx.engine.handle({ type: "OperationSubmittedForReview", operationId: "op-7", submittedBy: "asesor-7", occurredAt: "2026-09-30T10:00:00.000Z" }),
      ).toBeNull();
      await expect(ctx.engine.handle({ ...uploaded, documentType: "PASAPORTE" } as never)).rejects.toMatchObject({ code: "VALIDATION" });
    });

    it("con el motor apagado un hecho no es un error: no hay trabajo", async () => {
      const disabled = createDisabledAiEngine();
      expect(await disabled.handle(uploaded)).toBeNull();
      expect(await disabled.status()).toEqual({ enabled: false, queued: 0, running: 0, oldestQueuedAt: null });
    });
  });

  it("status informa cola y ejecuciones en curso (para detectar un worker caído)", async () => {
    const a = await ctx.engine.extractDocument({ documentRef: "doc-1", documentType: "INCOME_RECEIPT", requestedBy: advisorRequester });
    expect(await ctx.engine.status()).toEqual({ enabled: true, queued: 1, running: 0, oldestQueuedAt: "2026-09-30T10:00:00.000Z" });
    await ctx.runs.claim(a.runId, ctx.clock.now().toISOString(), "2000-01-01T00:00:00.000Z");
    expect(await ctx.engine.status()).toMatchObject({ queued: 0, running: 1, oldestQueuedAt: null });
  });
});
