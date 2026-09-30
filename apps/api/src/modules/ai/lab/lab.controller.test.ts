import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { NotFoundException } from "@nestjs/common";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AI_ENGINE_CONFIG_SEED, createAiEngine, type AiEngine } from "@crece/ai-engine";
import {
  FakeHasher,
  FakeOcrProvider,
  FixedClock,
  InMemoryExtractionStore,
  InMemoryJobQueue,
  InMemoryRunStore,
  RecordingDelay,
  syntheticPdf,
} from "@crece/ai-engine/testing";
import { loadAiEnv } from "../../infrastructure/ai/ai-env";
import { FileSystemDocumentSource } from "../../infrastructure/ai/storage/fs-document-source";
import type { AiRuntime } from "./ai-runtime";
import { LAB_REQUESTER, LabController } from "./lab.controller";

describe("LabController", () => {
  let root: string;
  let engine: AiEngine;
  let controller: LabController;
  let jobs: InMemoryJobQueue;
  let runs: InMemoryRunStore;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), "crece-lab-ctl-"));
    const labStorage = new FileSystemDocumentSource(root);
    jobs = new InMemoryJobQueue();
    runs = new InMemoryRunStore();
    engine = createAiEngine({
      runs,
      extractions: new InMemoryExtractionStore(),
      jobs,
      documents: labStorage,
      ocr: new FakeOcrProvider("fake", { model: "fake", pages: [], usage: { pagesProcessed: 0 } }),
      clock: new FixedClock(),
      ids: { newId: () => crypto.randomUUID() },
      hasher: new FakeHasher(),
      delay: new RecordingDelay(),
      config: AI_ENGINE_CONFIG_SEED,
    });
    const runtime: AiRuntime = {
      env: loadAiEnv({ AI_LAB_ENABLED: "true" }),
      engine,
      labStorage,
      queue: null,
      config: AI_ENGINE_CONFIG_SEED,
      close: async () => {},
    };
    controller = new LabController(runtime);
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it("subir un archivo solo delega en ExtractDocument, marcado como lab", async () => {
    const spy = vi.spyOn(engine, "extractDocument");
    const pdf = syntheticPdf([["Recibo sintético"]]);
    const result = await controller.upload(
      { buffer: Buffer.from(pdf), originalname: "recibo.pdf", mimetype: "application/pdf", size: pdf.length },
      "INCOME_RECEIPT",
    );
    expect(result).toMatchObject({ status: "QUEUED", fileName: "recibo.pdf", documentRef: expect.stringMatching(/^lab\//) });
    expect(spy).toHaveBeenCalledWith({
      documentRef: result.documentRef,
      documentType: "INCOME_RECEIPT",
      requestedBy: LAB_REQUESTER,
      lab: true,
    });
    expect(jobs.jobs).toHaveLength(1);
  });

  it("valida que venga archivo y tipo", async () => {
    await expect(controller.upload(undefined, "DPI")).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(
      controller.upload({ buffer: Buffer.from([1]), originalname: "x.pdf", mimetype: "application/pdf", size: 1 }, undefined),
    ).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(
      controller.upload({ buffer: Buffer.from("%PDF-"), originalname: "x.pdf", mimetype: "application/pdf", size: 5 }, "PASAPORTE"),
    ).rejects.toMatchObject({ code: "VALIDATION" });
  });

  it("no expone ejecuciones que no son del lab", async () => {
    await runs.createOrGet({ id: "11111111-1111-4111-8111-111111111111", task: "EXTRACT", forced: false, isLab: false, createdAt: "t" });
    await expect(controller.run("11111111-1111-4111-8111-111111111111")).rejects.toThrow(NotFoundException);
  });

  it("meta expone tipos, límites y el aviso de datos sintéticos", () => {
    const meta = controller.meta();
    expect(meta.documentTypes.find((t) => t.type === "DPI")?.fields.map((f) => f.key)).toContain("cui");
    expect(meta.limits.maxPages).toBe(60);
    expect(meta.notice).toContain("sintéticos");
  });

  it("runs rechaza tareas desconocidas", () => {
    expect(() => controller.runs("BORRAR_TODO")).toThrow(expect.objectContaining({ code: "VALIDATION" }));
  });
});
