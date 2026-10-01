import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AiEngineError, type AiEngineEvent, type OcrDocument } from "@crece/ai-engine";
import { FakeOcrProvider, InMemoryDocumentSource, advisorRequester, syntheticPdf } from "@crece/ai-engine/testing";
import { loadAiEnv } from "../../infrastructure/ai/ai-env";
import { createTestDatabase, type TestDatabase } from "../../infrastructure/ai/db/test-database";
import { composeAiRuntime, type AiRuntime } from "./ai-runtime";
import { createLabContext, type LabContext } from "./lab/lab-context";

const dpiOcr: OcrDocument = {
  model: "mistral-ocr-4-1",
  usage: { pagesProcessed: 1 },
  annotation: { full_name: "ANA LOPEZ SINTETICA", cui: "2345678901202", birth_date: "01/12/1985", expiry_date: "01/12/2030" },
  pages: [
    {
      index: 1,
      markdown: "REPUBLICA DE GUATEMALA\nANA LOPEZ SINTETICA\nCUI 2345 67890 1202\nNacimiento 01/12/1985\nVence 01/12/2030",
      blocks: [{ text: "CUI 2345 67890 1202", confidence: 0.93, bbox: { x: 0.1, y: 0.3, width: 0.4, height: 0.04 } }],
      images: [{ id: "img-0", classification: { kind: "ID_PHOTO", relevant: false, description: "Foto" } }],
      confidence: 0.92,
    },
  ],
};

async function waitFor(predicate: () => Promise<boolean> | boolean, timeoutMs = 20_000): Promise<void> {
  const started = Date.now();
  while (!(await predicate())) {
    if (Date.now() - started > timeoutMs) throw new Error("timeout esperando la condición");
    await new Promise((r) => setTimeout(r, 150));
  }
}

/**
 * Extremo a extremo con Postgres real (Compose), pg-boss, dos procesos lógicos (API y worker) y
 * el almacenamiento del lab. Solo el OCR es falso (sin gastar créditos del proveedor).
 */
describe("motor de IA encendido: API + worker + cola + outbox + lab", () => {
  let db: TestDatabase;
  let labDir: string;
  let api: AiRuntime;
  let worker: AiRuntime;
  let lab: LabContext;
  const hostDocs = new InMemoryDocumentSource();
  const ocr = new FakeOcrProvider("mistral-ocr-4-1", dpiOcr);
  const received: AiEngineEvent[] = [];

  beforeAll(async () => {
    db = await createTestDatabase();
    labDir = await mkdtemp(join(tmpdir(), "crece-lab-e2e-"));
    const env = loadAiEnv({
      AI_ENGINE_ENABLED: "true",
      AI_LAB_ENABLED: "true",
      AI_LAB_STORAGE_DIR: labDir,
      AI_DATABASE_URL: db.url,
      AI_EMBEDDING_DIMENSIONS: "768",
      MISTRAL_API_KEY: "no-se-usa-en-esta-prueba",
      AI_GOOGLE_API_KEY: "no-se-usa-en-esta-prueba",
    });
    lab = createLabContext(env)!;
    const common = { documentRoutes: [lab.documentRoute], hostDocuments: hostDocs, ocr, intervals: { heartbeatMs: 200, maintenanceMs: 200, relayMs: 100 } };
    api = await composeAiRuntime(env, { role: "api", ...common });
    worker = await composeAiRuntime(env, { role: "worker", ...common });
    api.events.subscribe((event) => void received.push(event));
    api.startRelay();
    await worker.startWorker();
  });

  afterAll(async () => {
    await worker?.close();
    await api?.close();
    await db?.drop();
    await rm(labDir, { recursive: true, force: true });
  });

  it("archivo del lab → comando → cola → worker → extracción → evento al suscriptor de la API", async () => {
    const stored = await lab.storage.put({ bytes: syntheticPdf([["REPUBLICA DE GUATEMALA", "ANA LOPEZ SINTETICA"]]), fileName: "dpi-sintetico.pdf" });
    const accepted = await api.engine.extractDocument({ documentRef: stored.ref, documentType: "DPI", requestedBy: advisorRequester, lab: true });
    expect(accepted.status).toBe("QUEUED");

    await waitFor(async () => (await api.engine.getRun(accepted.runId))?.status === "SUCCEEDED");
    const run = (await api.engine.getRun(accepted.runId))!;
    expect(run).toMatchObject({ modelId: "mistral-ocr-4-1", isLab: true, attempts: 1 });
    expect(run.costEstimateUsd).toBeCloseTo(0.005);

    const extraction = (await api.engine.getExtractionByDocumentRef(stored.ref))!;
    expect(extraction.candidates.map((c) => [c.fieldKey, c.value])).toEqual([
      ["full_name", "ANA LOPEZ SINTETICA"],
      ["cui", "2345 67890 1202"],
      ["birth_date", "01/12/1985"],
      ["expiry_date", "01/12/2030"],
    ]);
    expect(extraction.candidates.find((c) => c.fieldKey === "cui")?.bbox).toEqual({ x: 0.1, y: 0.3, width: 0.4, height: 0.04 });
    expect(extraction.pipelineFingerprint).toMatch(/^extract-v2:/);

    await waitFor(() => received.some((e) => e.runId === accepted.runId));
    const event = received.find((e) => e.runId === accepted.runId)!;
    expect(event).toMatchObject({ type: "DocumentExtractionCompleted", schemaVersion: 1, candidateCount: 4, injectionSuspected: false, lab: true });
    const { rows } = await db.pool.query("SELECT published_at IS NOT NULL AS published FROM ai.outbox WHERE payload->>'runId' = $1", [accepted.runId]);
    expect(rows).toEqual([{ published: true }]);
  });

  it("hecho del anfitrión (DocumentUploaded) → extracción de producción, sin compartir la del lab", async () => {
    hostDocs.put({ ref: "asset-dpi-1", fileName: "dpi.pdf", mimeType: "application/pdf", bytes: syntheticPdf([["REPUBLICA DE GUATEMALA", "ANA LOPEZ SINTETICA"]]) });
    const accepted = await api.engine.handle({
      type: "DocumentUploaded",
      documentAssetId: "asset-dpi-1",
      operationId: "op-e2e",
      checklistCode: "DPI",
      documentType: "DPI",
      uploadedBy: "asesor-e2e",
      occurredAt: new Date().toISOString(),
    });
    await waitFor(async () => (await api.engine.getRun(accepted!.runId))?.status === "SUCCEEDED");
    const extraction = (await api.engine.getExtractionByDocumentRef("asset-dpi-1"))!;
    expect(extraction.isLab).toBe(false);
    expect(await api.engine.getRun(accepted!.runId)).toMatchObject({ operationId: "op-e2e", requestedBy: "asesor-e2e", isLab: false });
  });

  it("un fallo del proveedor se puede reintentar hasta terminar bien", async () => {
    ocr.script("reintento.pdf", new AiEngineError("AI_PROVIDER_AUTH", "Credenciales rechazadas"), dpiOcr);
    const stored = await lab.storage.put({ bytes: syntheticPdf([["Otro DPI", "ANA LOPEZ SINTETICA"]]), fileName: "reintento.pdf" });
    const first = await api.engine.extractDocument({ documentRef: stored.ref, documentType: "DPI", requestedBy: advisorRequester, lab: true });
    await waitFor(async () => (await api.engine.getRun(first.runId))?.status === "FAILED");
    await waitFor(() => received.some((e) => e.runId === first.runId && e.type === "AiRunFailed"));

    const retried = await api.engine.retryRun({ runId: first.runId, requestedBy: advisorRequester });
    await waitFor(async () => (await api.engine.getRun(retried.runId))?.status === "SUCCEEDED");
    expect((await api.engine.getRun(retried.runId))?.retryOf).toBe(first.runId);
  });

  it("la salud muestra al worker vivo y la cola vacía", async () => {
    await waitFor(async () => (await api.health()).workersOnline >= 1);
    expect(await api.health()).toMatchObject({ enabled: true, queued: 0, running: 0 });
  });

  it("la configuración viva de ai.config se aplica sobre la semilla", () => {
    expect(api.config?.models.ocr).toBe("mistral-ocr-4-1");
    expect(api.config?.extraction.maxPages).toBe(60);
  });
});
