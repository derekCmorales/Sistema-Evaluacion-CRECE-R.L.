import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { OcrDocument } from "@crece/ai-engine";
import { FakeOcrProvider, advisorRequester, syntheticPdf } from "@crece/ai-engine/testing";
import { loadAiEnv } from "../../infrastructure/ai/ai-env";
import { createTestDatabase, type TestDatabase } from "../../infrastructure/ai/db/test-database";
import { composeAiRuntime, type AiRuntime } from "./ai-runtime";

const dpiOcr: OcrDocument = {
  model: "fake-ocr-e2e",
  usage: { pagesProcessed: 1 },
  annotation: { full_name: "ANA LOPEZ SINTETICA", cui: "2345678901202", birth_date: "01/12/1985", expiry_date: "01/12/2030" },
  pages: [
    {
      index: 1,
      markdown: "REPUBLICA DE GUATEMALA\nANA LOPEZ SINTETICA\nCUI 2345 67890 1202\nNacimiento 01/12/1985\nVence 01/12/2030",
      blocks: [{ text: "CUI 2345 67890 1202", confidence: 0.93 }],
      images: [{ id: "img-0", classification: { kind: "ID_PHOTO", relevant: false, description: "Foto" } }],
      confidence: 0.92,
    },
  ],
};

async function waitFor(predicate: () => Promise<boolean>, timeoutMs = 20_000): Promise<void> {
  const started = Date.now();
  while (!(await predicate())) {
    if (Date.now() - started > timeoutMs) throw new Error("timeout esperando la condición");
    await new Promise((r) => setTimeout(r, 150));
  }
}

describe("motor de IA encendido (Postgres real + cola + lab, OCR falso)", () => {
  let db: TestDatabase;
  let labDir: string;
  let runtime: AiRuntime;
  const ocr = new FakeOcrProvider("mistral-ocr-latest", dpiOcr);

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
    runtime = await composeAiRuntime(env, { ocr });
    await runtime.queue!.work((job) => runtime.engine.executeRun(job.runId), 2);
  });

  afterAll(async () => {
    await runtime?.close();
    await db?.drop();
    await rm(labDir, { recursive: true, force: true });
  });

  it("archivo del lab → comando → cola → worker → extracción y evento persistidos", async () => {
    const stored = await runtime.labStorage!.put({
      bytes: syntheticPdf([["REPUBLICA DE GUATEMALA", "ANA LOPEZ SINTETICA"]]),
      fileName: "dpi-sintetico.pdf",
      mimeType: "application/pdf",
    });
    const accepted = await runtime.engine.extractDocument({
      documentRef: stored.ref,
      documentType: "DPI",
      requestedBy: advisorRequester,
      lab: true,
    });
    expect(accepted.status).toBe("QUEUED");

    await waitFor(async () => (await runtime.engine.getRun(accepted.runId))?.status === "SUCCEEDED");
    const run = (await runtime.engine.getRun(accepted.runId))!;
    expect(run).toMatchObject({ modelId: "fake-ocr-e2e", isLab: true, attempts: 1 });

    const extraction = (await runtime.engine.getExtraction((run.output as { extractionId: string }).extractionId))!;
    expect(extraction.candidates.map((c) => [c.fieldKey, c.value])).toEqual([
      ["full_name", "ANA LOPEZ SINTETICA"],
      ["cui", "2345 67890 1202"],
      ["birth_date", "01/12/1985"],
      ["expiry_date", "01/12/2030"],
    ]);
    expect(ocr.calls[0]!.imageClassificationSchema?.name).toBe("crece_image_classification_v1");

    const { rows } = await db.pool.query("SELECT event_type, payload FROM ai.outbox WHERE payload->>'runId' = $1", [accepted.runId]);
    expect(rows).toHaveLength(1);
    expect(rows[0].event_type).toBe("DocumentExtractionCompleted");
    expect(rows[0].payload).toMatchObject({ candidateCount: 4, lab: true });
  });

  it("la configuración viva de ai.config se aplica sobre la semilla", async () => {
    expect(runtime.config?.models.llm).toBe("gemini-3.8-flash");
    expect(runtime.config?.extraction.maxPages).toBe(60);
  });
});
