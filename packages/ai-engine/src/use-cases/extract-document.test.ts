import { beforeEach, describe, expect, it } from "vitest";
import { AiEngineError } from "../contracts/errors";
import type { OcrDocument } from "../contracts/ocr";
import { resolveAiEngineConfig } from "../config/engine-config";
import { createAiEngine } from "../engine";
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

const bureauOcr: OcrDocument = {
  model: "mistral-ocr-2607",
  usage: { pagesProcessed: 1 },
  annotation: { total_monthly_payment: "Q3,200.00", active_debts_count: "2" },
  pages: [
    {
      index: 1,
      markdown: "Créditos vigentes: 2\nCuota mensual total: Q3,200.00",
      blocks: [{ text: "Cuota mensual total: Q3,200.00", confidence: 0.96 }],
      images: [],
      confidence: 0.95,
    },
  ],
};

function setup() {
  const runs = new InMemoryRunStore();
  const extractions = new InMemoryExtractionStore();
  const jobs = new InMemoryJobQueue();
  const documents = new InMemoryDocumentSource();
  const ocr = new FakeOcrProvider("mistral-ocr-latest", bureauOcr);
  const delay = new RecordingDelay();
  const engine = createAiEngine({
    runs,
    extractions,
    jobs,
    documents,
    ocr,
    clock: new FixedClock(),
    ids: new SequentialIdGenerator("id"),
    hasher: new FakeHasher(),
    delay,
    config: resolveAiEngineConfig({ extraction: { maxAttempts: 3, backoffMs: [100, 400] } }),
  });
  const runAll = () => jobs.drain((job) => engine.executeRun(job.runId));
  return { runs, extractions, jobs, documents, ocr, delay, engine, runAll };
}

const bureauPdf = syntheticPdf([["Créditos vigentes: 2", "Cuota mensual total: Q3,200.00"]]);

describe("ExtractDocument", () => {
  let ctx: ReturnType<typeof setup>;
  beforeEach(() => {
    ctx = setup();
    ctx.documents.put({ ref: "doc-bureau", fileName: "buro.pdf", mimeType: "application/pdf", bytes: bureauPdf });
  });

  it("acepta de inmediato y encola; el worker extrae y emite el evento", async () => {
    const accepted = await ctx.engine.extractDocument({
      documentRef: "doc-bureau",
      documentType: "BUREAU_REPORT",
      operationId: "op-1",
      requestedBy: advisorRequester,
    });
    expect(accepted).toMatchObject({ status: "QUEUED", reused: false });
    expect(ctx.jobs.jobs).toHaveLength(1);

    await ctx.runAll();
    const run = await ctx.engine.getRun(accepted.runId);
    expect(run).toMatchObject({ status: "SUCCEEDED", modelId: "mistral-ocr-2607", attempts: 1 });
    expect(run?.costEstimateUsd).toBeCloseTo(0.004);
    expect(ctx.runs.events).toEqual([
      expect.objectContaining({
        type: "DocumentExtractionCompleted",
        documentRef: "doc-bureau",
        operationId: "op-1",
        candidateCount: 2,
        needsAttentionCount: 0,
        lab: false,
      }),
    ]);
    const extraction = await ctx.engine.getExtraction((run!.output as { extractionId: string }).extractionId);
    expect(extraction?.candidates.map((c) => c.value)).toEqual(["2", "Q3,200.00"]);
    expect(extraction?.ocrModel).toBe("mistral-ocr-latest");
  });

  it("envía al proveedor el tipo real, el esquema del tipo y sin clasificar imágenes en el buró", async () => {
    await ctx.engine.extractDocument({ documentRef: "doc-bureau", documentType: "BUREAU_REPORT", requestedBy: advisorRequester });
    await ctx.runAll();
    const request = ctx.ocr.calls[0]!;
    expect(request.mimeType).toBe("application/pdf");
    expect(request.annotationSchema?.name).toBe("crece_bureau_report_v1");
    expect(request.imageClassificationSchema).toBeUndefined();
  });

  it("es idempotente por documento: dos solicitudes, una ejecución", async () => {
    const a = await ctx.engine.extractDocument({ documentRef: "doc-bureau", documentType: "BUREAU_REPORT", requestedBy: advisorRequester });
    const b = await ctx.engine.extractDocument({ documentRef: "doc-bureau", documentType: "BUREAU_REPORT", requestedBy: advisorRequester });
    expect(b).toMatchObject({ runId: a.runId, reused: true });
    expect(ctx.jobs.jobs).toHaveLength(1);
  });

  it("un comando mal formado es error de validación con el campo, no un error interno", async () => {
    await expect(
      ctx.engine.extractDocument({ documentRef: "", documentType: "BUREAU_REPORT", requestedBy: advisorRequester }),
    ).rejects.toMatchObject({ code: "VALIDATION", message: expect.stringContaining("documentRef") });
  });

  it("consultar ≠ operar: el Consejo no dispara extracciones", async () => {
    await expect(
      ctx.engine.extractDocument({ documentRef: "doc-bureau", documentType: "BUREAU_REPORT", requestedBy: councilRequester }),
    ).rejects.toMatchObject({ code: "AI_FORBIDDEN" });
  });

  it("mismo archivo en otra casilla: se reutiliza sin llamar al proveedor", async () => {
    ctx.documents.put({ ref: "doc-copy", fileName: "copia.pdf", mimeType: "application/pdf", bytes: bureauPdf });
    await ctx.engine.extractDocument({ documentRef: "doc-bureau", documentType: "BUREAU_REPORT", requestedBy: advisorRequester });
    await ctx.runAll();
    const second = await ctx.engine.extractDocument({ documentRef: "doc-copy", documentType: "BUREAU_REPORT", requestedBy: advisorRequester });
    await ctx.runAll();
    expect(ctx.ocr.calls).toHaveLength(1);
    const run = await ctx.engine.getRun(second.runId);
    expect(run).toMatchObject({ status: "REUSED", costEstimateUsd: 0 });
    expect((await ctx.extractions.findByDocumentRef("doc-copy"))?.id).toBe(
      (await ctx.extractions.findByDocumentRef("doc-bureau"))?.id,
    );
  });

  it("PDF cifrado: falla con motivo claro y sin costo de proveedor", async () => {
    ctx.documents.put({ ref: "doc-locked", fileName: "x.pdf", mimeType: "application/pdf", bytes: syntheticPdf([["x"]], { encrypted: true }) });
    const accepted = await ctx.engine.extractDocument({ documentRef: "doc-locked", documentType: "DPI", requestedBy: advisorRequester });
    await ctx.runAll();
    expect(ctx.ocr.calls).toHaveLength(0);
    expect(await ctx.engine.getRun(accepted.runId)).toMatchObject({
      status: "FAILED",
      errorCode: "AI_INPUT_ENCRYPTED",
      errorMessage: "PDF protegido con contraseña: súbelo sin protección",
    });
    expect(ctx.runs.events[0]).toMatchObject({ type: "AiRunFailed", errorCode: "AI_INPUT_ENCRYPTED", retryable: false });
  });

  it("documento inexistente: FAILED con AI_NOT_FOUND", async () => {
    const accepted = await ctx.engine.extractDocument({ documentRef: "no-existe", documentType: "DPI", requestedBy: advisorRequester });
    await ctx.runAll();
    expect(await ctx.engine.getRun(accepted.runId)).toMatchObject({ status: "FAILED", errorCode: "AI_NOT_FOUND" });
  });

  it("reintenta timeouts con espera creciente y termina bien", async () => {
    ctx.ocr.script("buro.pdf", new AiEngineError("AI_PROVIDER_TIMEOUT", "timeout"), bureauOcr);
    const accepted = await ctx.engine.extractDocument({ documentRef: "doc-bureau", documentType: "BUREAU_REPORT", requestedBy: advisorRequester });
    await ctx.runAll();
    expect(await ctx.engine.getRun(accepted.runId)).toMatchObject({ status: "SUCCEEDED", attempts: 2 });
    expect(ctx.delay.waits).toEqual([100]);
  });

  it("agota reintentos: FAILED reintentable; el documento no se pierde", async () => {
    const timeout = new AiEngineError("AI_PROVIDER_TIMEOUT", "El proveedor no respondió");
    ctx.ocr.script("buro.pdf", timeout, timeout, timeout, timeout);
    const accepted = await ctx.engine.extractDocument({ documentRef: "doc-bureau", documentType: "BUREAU_REPORT", requestedBy: advisorRequester });
    await ctx.runAll();
    expect(await ctx.engine.getRun(accepted.runId)).toMatchObject({ status: "FAILED", errorCode: "AI_PROVIDER_TIMEOUT", attempts: 3 });
    expect(ctx.delay.waits).toEqual([100, 400]);
    expect(ctx.runs.events[0]).toMatchObject({ type: "AiRunFailed", retryable: true });
  });

  it("credenciales rechazadas no se reintentan", async () => {
    ctx.ocr.script("buro.pdf", new AiEngineError("AI_PROVIDER_AUTH", "Credenciales rechazadas"));
    const accepted = await ctx.engine.extractDocument({ documentRef: "doc-bureau", documentType: "BUREAU_REPORT", requestedBy: advisorRequester });
    await ctx.runAll();
    expect(ctx.ocr.calls).toHaveLength(1);
    expect(await ctx.engine.getRun(accepted.runId)).toMatchObject({ status: "FAILED", errorCode: "AI_PROVIDER_AUTH" });
  });

  it("un error inesperado del adaptador se registra sin detalles internos", async () => {
    ctx.ocr.script("buro.pdf", new Error("socket hang up at 10.0.0.3 with token=abc"));
    const accepted = await ctx.engine.extractDocument({ documentRef: "doc-bureau", documentType: "BUREAU_REPORT", requestedBy: advisorRequester });
    await ctx.runAll();
    const run = await ctx.engine.getRun(accepted.runId);
    expect(run?.errorCode).toBe("AI_PROVIDER_ERROR");
    expect(run?.errorMessage).not.toContain("token");
  });

  it("ejecutar dos veces el mismo run no repite trabajo (reentrega de la cola)", async () => {
    const accepted = await ctx.engine.extractDocument({ documentRef: "doc-bureau", documentType: "BUREAU_REPORT", requestedBy: advisorRequester });
    await ctx.engine.executeRun(accepted.runId);
    await ctx.engine.executeRun(accepted.runId);
    expect(ctx.ocr.calls).toHaveLength(1);
    expect(ctx.runs.events).toHaveLength(1);
  });

  it("lab: la marca viaja a la ejecución, la extracción y el evento", async () => {
    const accepted = await ctx.engine.extractDocument({
      documentRef: "doc-bureau",
      documentType: "BUREAU_REPORT",
      requestedBy: advisorRequester,
      lab: true,
    });
    await ctx.runAll();
    const run = await ctx.engine.getRun(accepted.runId);
    expect(run?.isLab).toBe(true);
    expect((await ctx.engine.getExtraction((run!.output as { extractionId: string }).extractionId))?.isLab).toBe(true);
    expect(ctx.runs.events[0]).toMatchObject({ lab: true });
  });
});
