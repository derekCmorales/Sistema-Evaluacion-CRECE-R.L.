import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { NotFoundException } from "@nestjs/common";
import type { Response } from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AI_ENGINE_CONFIG_SEED, AiEngineError, createAiEngine, type AiEngine } from "@crece/ai-engine";
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
import { loadAiEnv } from "../../../infrastructure/ai/ai-env";
import { FileSystemDocumentSource, LAB_REF_PREFIX } from "../../../infrastructure/ai/lab/fs-document-source";
import { RoutingDocumentSource } from "../../../infrastructure/ai/runtime";
import type { AiRuntime } from "../ai-runtime";
import { AiEventBus } from "../ai-event-bus";
import type { LabContext } from "./lab-context";
import { LAB_REQUESTER, LabController } from "./lab.controller";

function fakeResponse() {
  const headers: Record<string, string> = {};
  let body: Buffer | undefined;
  const res = {
    setHeader: (k: string, v: string) => void (headers[k.toLowerCase()] = v),
    send: (b: Buffer) => void (body = b),
  };
  return { res: res as unknown as Response, headers, body: () => body };
}

describe("LabController", () => {
  let root: string;
  let engine: AiEngine;
  let controller: LabController;
  let jobs: InMemoryJobQueue;
  let runs: InMemoryRunStore;
  let extractions: InMemoryExtractionStore;
  let ocr: FakeOcrProvider;
  let lab: LabContext;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), "crece-lab-ctl-"));
    const storage = new FileSystemDocumentSource(root);
    lab = { storage, retentionDays: 7, documentRoute: { prefix: LAB_REF_PREFIX, source: storage } };
    jobs = new InMemoryJobQueue();
    runs = new InMemoryRunStore();
    extractions = new InMemoryExtractionStore();
    ocr = new FakeOcrProvider("mistral-ocr-4-1", { model: "mistral-ocr-4-1", pages: [], usage: { pagesProcessed: 0 } });
    engine = createAiEngine({
      runs,
      extractions,
      jobs,
      documents: new RoutingDocumentSource([lab.documentRoute], null),
      ocr,
      clock: new FixedClock(),
      ids: { newId: () => crypto.randomUUID() },
      hasher: new FakeHasher(),
      delay: new RecordingDelay(),
      config: AI_ENGINE_CONFIG_SEED,
    });
    const runtime: AiRuntime = {
      env: loadAiEnv({ AI_LAB_ENABLED: "true" }),
      engine,
      events: new AiEventBus(),
      config: AI_ENGINE_CONFIG_SEED,
      pool: null,
      health: async () => ({ ...(await engine.status()), workersOnline: 1, workerLastSeenAt: "2026-09-30T10:00:00.000Z" }),
      startWorker: async () => undefined,
      startRelay: () => undefined,
      close: async () => undefined,
    };
    controller = new LabController(engine, runtime, lab);
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  const uploadPdf = () => {
    const pdf = syntheticPdf([["Recibo sintético"]]);
    return controller.upload(
      { buffer: Buffer.from(pdf), originalname: "recibo.pdf", mimetype: "application/pdf", size: pdf.length },
      "INCOME_RECEIPT",
    );
  };

  it("subir un archivo solo delega en ExtractDocument, marcado como lab", async () => {
    const spy = vi.spyOn(engine, "extractDocument");
    const result = await uploadPdf();
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

  it("sirve el archivo con el tipo detectado por contenido, nunca el que mandó el navegador", async () => {
    const pdf = await uploadPdf();
    const inline = fakeResponse();
    await controller.file(pdf.documentRef.slice(LAB_REF_PREFIX.length), inline.res);
    expect(inline.headers["content-type"]).toBe("application/pdf");
    expect(inline.headers["content-disposition"]).toMatch(/^inline;/);
    expect(inline.headers["x-content-type-options"]).toBe("nosniff");

    const html = await controller.upload(
      { buffer: Buffer.from("<html><script>alert(1)</script></html>"), originalname: "x.pdf", mimetype: "text/html", size: 40 },
      "OTHER",
    );
    const attachment = fakeResponse();
    await controller.file(html.documentRef.slice(LAB_REF_PREFIX.length), attachment.res);
    expect(attachment.headers["content-type"]).toBe("application/octet-stream");
    expect(attachment.headers["content-disposition"]).toMatch(/^attachment;/);
    expect(attachment.headers["content-security-policy"]).toContain("sandbox");
  });

  it("no expone ejecuciones ni extracciones que no son del lab", async () => {
    await runs.createOrGet({ id: "11111111-1111-4111-8111-111111111111", task: "EXTRACT", forced: false, isLab: false, createdAt: "t" });
    await expect(controller.run("11111111-1111-4111-8111-111111111111")).rejects.toThrow(NotFoundException);
    await expect(controller.retry("11111111-1111-4111-8111-111111111111")).rejects.toThrow(NotFoundException);
    await extractions.save({
      id: "22222222-2222-4222-8222-222222222222",
      fileSha256: "s",
      ocrModel: "m",
      documentType: "DPI",
      schemaCode: "DPI",
      schemaVersion: 1,
      pipelineFingerprint: "f",
      injectionSuspected: false,
      pages: [{ index: 1, text: "Expediente real" }],
      candidates: [],
      images: [],
      createdAt: "t",
      isLab: false,
    });
    await expect(controller.extraction("22222222-2222-4222-8222-222222222222")).rejects.toThrow(NotFoundException);
  });

  it("reintenta una ejecución fallida del lab", async () => {
    ocr.script("recibo.pdf", new AiEngineError("AI_PROVIDER_AUTH", "Credenciales rechazadas"));
    const accepted = await uploadPdf();
    await jobs.drain((job) => engine.executeRun(job.runId));
    expect((await controller.run(accepted.runId)).status).toBe("FAILED");
    const retried = await controller.retry(accepted.runId);
    expect(retried).toMatchObject({ status: "QUEUED", reused: false });
    expect(retried.runId).not.toBe(accepted.runId);
  });

  it("meta expone tipos, límites, retención y el aviso; status informa cola y workers", async () => {
    const meta = controller.meta();
    expect(meta.documentTypes.find((t) => t.type === "DPI")?.fields.map((f) => f.key)).toContain("cui");
    expect(meta.limits.maxPages).toBe(60);
    expect(meta.retentionDays).toBe(7);
    expect(meta.models.ocr).toBe("mistral-ocr-4-1");
    expect(meta.notice).toContain("sintéticos");
    await uploadPdf();
    expect(await controller.status()).toMatchObject({ enabled: true, queued: 1, workersOnline: 1 });
  });

  it("runs rechaza tareas desconocidas", () => {
    expect(() => controller.runs("BORRAR_TODO")).toThrow(expect.objectContaining({ code: "VALIDATION" }));
  });
});
