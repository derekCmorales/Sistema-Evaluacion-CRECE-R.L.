import { describe, expect, it } from "vitest";
import { CaseSnapshotSchema } from "../contracts";
import {
  FakeEmbeddingProvider,
  FakeHasher,
  FakeLlmProvider,
  FakeOcrProvider,
  FixedClock,
  InMemoryCaseSnapshotSource,
  InMemoryExtractionStore,
  InMemoryJobQueue,
  InMemoryKnowledgeStore,
  InMemoryRunStore,
  bagOfWordsVector,
  councilCaseSnapshot,
  donMarcoSnapshot,
} from "./index";
import type { KnowledgeChunk, KnowledgeSource } from "../ports";

describe("fixtures", () => {
  it("los snapshots de ejemplo cumplen el contrato", () => {
    expect(CaseSnapshotSchema.safeParse(donMarcoSnapshot).success).toBe(true);
    expect(CaseSnapshotSchema.safeParse(councilCaseSnapshot).success).toBe(true);
  });
});

describe("InMemoryRunStore", () => {
  it("es idempotente por clave y tarea", async () => {
    const store = new InMemoryRunStore();
    const base = { task: "REVIEW" as const, forced: false, isLab: false, createdAt: "2026-09-28T10:00:00.000Z" };
    const first = await store.createOrGet({ ...base, id: "r1", idempotencyKey: "op-1" });
    const second = await store.createOrGet({ ...base, id: "r2", idempotencyKey: "op-1" });
    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(second.run.id).toBe("r1");
  });

  it("publica eventos junto con el éxito y encuentra resultados reutilizables", async () => {
    const store = new InMemoryRunStore();
    await store.createOrGet({ id: "r1", task: "DRAFT_5C", forced: false, isLab: false, createdAt: "t" });
    await store.markSucceeded(
      "r1",
      { inputSha256: "h", modelId: "m", promptVersion: "v1" },
      "t2",
      [{ type: "Draft5CReady", runId: "r1", occurredAt: "2026-09-28T10:00:00.000Z", lab: false, operationId: "op" }],
    );
    expect(store.events).toHaveLength(1);
    const reusable = await store.findReusable({
      task: "DRAFT_5C",
      inputSha256: "h",
      modelId: "m",
      promptVersion: "v1",
      isLab: false,
    });
    expect(reusable?.id).toBe("r1");
    expect(
      await store.findReusable({ task: "DRAFT_5C", inputSha256: "h", modelId: "m", promptVersion: "v2", isLab: false }),
    ).toBeNull();
  });
});

describe("InMemoryExtractionStore", () => {
  it("deduplica por hash, modelo y esquema", async () => {
    const store = new InMemoryExtractionStore();
    const extraction = {
      id: "e1",
      fileSha256: "abc",
      ocrModel: "ocr-1",
      documentType: "DPI",
      schemaCode: "DPI",
      schemaVersion: 1,
      pages: [],
      candidates: [],
      images: [],
      createdAt: "t",
      isLab: false,
    };
    await store.save(extraction);
    const again = await store.save({ ...extraction, id: "e2" });
    expect(again.id).toBe("e1");
    await store.linkDocument("doc-a", "e1");
    expect((await store.findByDocumentRef("doc-a"))?.id).toBe("e1");
  });
});

describe("InMemoryKnowledgeStore", () => {
  const dims = 64;
  const source = (id: string, status: KnowledgeSource["status"], isLab = false): KnowledgeSource => ({
    id,
    code: "reglamento-credito",
    version: 1,
    status,
    title: "Reglamento de Crédito",
    effectiveFrom: "2026-01-01",
    fileSha256: id,
    structure: "STRUCTURED",
    isLab,
    createdAt: "t",
  });
  const chunk = (id: string, sourceId: string, content: string): KnowledgeChunk => ({
    id,
    sourceId,
    ordinal: 1,
    sectionPath: ["Reglamento", "Artículo 12"],
    pageStart: 3,
    pageEnd: 3,
    contextHeader: "Reglamento › Artículo 12",
    content,
    tokenCount: 20,
    contentSha256: `h-${id}`,
    chunkerVersion: "struct-v1",
    embeddingModel: "fake-embedding-1",
    embeddingDims: dims,
    embedding: bagOfWordsVector(content, dims),
  });

  it("no devuelve borradores ni fuentes de lab en producción", async () => {
    const store = new InMemoryKnowledgeStore();
    await store.saveSource(source("s-approved", "APPROVED"), [chunk("c1", "s-approved", "El fiador debe presentar constancia de ingresos")]);
    await store.saveSource(source("s-draft", "DRAFT"), [chunk("c2", "s-draft", "El fiador borrador")]);
    await store.saveSource(source("s-lab", "APPROVED", true), [chunk("c3", "s-lab", "El fiador de laboratorio")]);
    const query = {
      embedding: bagOfWordsVector("fiador", dims),
      text: "fiador",
      limit: 10,
      candidateDepth: 20,
      semanticWeight: 1,
      lexicalWeight: 1,
      efSearch: 40,
      includeDrafts: false,
      includeLab: false,
      includeQueryPlan: false,
    };
    const { hits } = await store.search(query);
    expect(hits.map((h) => h.chunkId)).toEqual(["c1"]);
    const labView = await store.search({ ...query, includeLab: true, includeDrafts: true });
    expect(labView.hits.map((h) => h.chunkId).sort()).toEqual(["c1", "c2", "c3"]);
  });

  it("aprobar una versión reemplaza la anterior", async () => {
    const store = new InMemoryKnowledgeStore();
    await store.saveSource(source("v1", "APPROVED"), []);
    await store.saveSource({ ...source("v2", "DRAFT"), version: 2 }, []);
    await store.approveSource("v2", "admin-1", "t");
    const sources = await store.listSources();
    expect(sources.find((s) => s.id === "v1")?.status).toBe("SUPERSEDED");
    expect(sources.find((s) => s.id === "v2")?.status).toBe("APPROVED");
    expect(await store.nextVersion("reglamento-credito")).toBe(3);
  });
});

describe("proveedores y runtime falsos", () => {
  it("el OCR falso sigue el guion y registra llamadas", async () => {
    const ocr = new FakeOcrProvider().script("dpi.pdf", new Error("timeout"), {
      model: "fake-ocr-1",
      pages: [],
      usage: { pagesProcessed: 1 },
    });
    const request = { bytes: new Uint8Array([1]), mimeType: "application/pdf", fileName: "dpi.pdf", classifyImages: false };
    await expect(ocr.extract(request)).rejects.toThrow("timeout");
    await expect(ocr.extract(request)).resolves.toMatchObject({ model: "fake-ocr-1" });
    expect(ocr.calls).toHaveLength(2);
  });

  it("el LLM falso responde en orden y falla si no hay guion", async () => {
    const llm = new FakeLlmProvider().respond({ rawText: "{}" });
    const request = {
      modelId: "m",
      systemInstruction: "s",
      contents: "c",
      responseJsonSchema: {},
      maxOutputTokens: 10,
      thinkingLevel: "LOW" as const,
    };
    await expect(llm.generateStructured(request)).resolves.toMatchObject({ rawText: "{}", finishReason: "STOP" });
    await expect(llm.generateStructured(request)).rejects.toThrow("sin respuestas");
  });

  it("los embeddings falsos tienen la dimensión pedida y están normalizados", async () => {
    const embeddings = new FakeEmbeddingProvider();
    const { vector } = await embeddings.embedQuery("garantía fiduciaria del fiador", 32);
    expect(vector).toHaveLength(32);
    expect(Math.hypot(...vector)).toBeCloseTo(1, 5);
  });

  it("hasher determinístico, reloj avanzable, cola y snapshots aislados", async () => {
    const hasher = new FakeHasher();
    expect(hasher.sha256Hex("a")).toBe(hasher.sha256Hex("a"));
    expect(hasher.sha256Hex("a")).not.toBe(hasher.sha256Hex("b"));

    const clock = new FixedClock();
    clock.advance(1000);
    expect(clock.now().toISOString()).toBe("2026-09-28T10:00:01.000Z");

    const queue = new InMemoryJobQueue();
    await queue.enqueue({ task: "EXTRACT", runId: "r1" });
    const seen: string[] = [];
    await queue.drain(async (job) => void seen.push(job.runId));
    expect(seen).toEqual(["r1"]);

    const snapshots = new InMemoryCaseSnapshotSource();
    snapshots.put(donMarcoSnapshot);
    const copy = await snapshots.get("op-don-marco");
    copy!.product.purpose = "mutado";
    expect((await snapshots.get("op-don-marco"))!.product.purpose).toBe("Inventario de ferretería");
  });
});
