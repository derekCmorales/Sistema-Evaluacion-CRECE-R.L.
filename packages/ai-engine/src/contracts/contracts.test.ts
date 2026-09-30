import { describe, expect, it } from "vitest";
import {
  AiEngineError,
  AiEngineEventSchema,
  CaseSnapshotSchema,
  ExtractDocumentCommandSchema,
  HostFactSchema,
  SearchKnowledgeCommandSchema,
} from "./index";
import { donMarcoSnapshot } from "../testing/fixtures";

const advisor = { userId: "asesor-1", offices: ["ADVISOR"] };

describe("CaseSnapshot", () => {
  it("acepta el caso de Don Marco", () => {
    expect(CaseSnapshotSchema.parse(donMarcoSnapshot).operationId).toBe("op-don-marco");
  });

  it("rechaza campos extra como umbral o ruta de autorización", () => {
    const withRoute = { ...donMarcoSnapshot, authorizationRoute: "COUNCIL_QUORUM" };
    expect(CaseSnapshotSchema.safeParse(withRoute).success).toBe(false);
    const withThreshold = { ...donMarcoSnapshot, thresholdGTQ: 100000 };
    expect(CaseSnapshotSchema.safeParse(withThreshold).success).toBe(false);
  });

  it("exige montos como decimal serializado", () => {
    const bad = { ...donMarcoSnapshot, product: { ...donMarcoSnapshot.product, requestedAmountGTQ: "Q40,000" } };
    expect(CaseSnapshotSchema.safeParse(bad).success).toBe(false);
  });
});

describe("comandos", () => {
  it("extraer requiere tipo de documento conocido", () => {
    expect(
      ExtractDocumentCommandSchema.safeParse({ documentRef: "d1", documentType: "BUREAU_REPORT", requestedBy: advisor })
        .success,
    ).toBe(true);
    expect(
      ExtractDocumentCommandSchema.safeParse({ documentRef: "d1", documentType: "PASAPORTE", requestedBy: advisor })
        .success,
    ).toBe(false);
  });

  it("extraer marca lab=false por defecto", () => {
    const parsed = ExtractDocumentCommandSchema.parse({ documentRef: "d1", documentType: "DPI", requestedBy: advisor });
    expect(parsed.lab).toBe(false);
  });

  it("buscar exige query o caseFacts, no ambos ni ninguno", () => {
    const facts = { productType: "WORKING_CAPITAL", guaranteeType: "PERSONAL", purpose: "x", hasGuarantor: false, hardRuleCodes: [] };
    expect(SearchKnowledgeCommandSchema.safeParse({ query: "fiador", requestedBy: advisor }).success).toBe(true);
    expect(SearchKnowledgeCommandSchema.safeParse({ caseFacts: facts, requestedBy: advisor }).success).toBe(true);
    expect(SearchKnowledgeCommandSchema.safeParse({ query: "x", caseFacts: facts, requestedBy: advisor }).success).toBe(false);
    expect(SearchKnowledgeCommandSchema.safeParse({ requestedBy: advisor }).success).toBe(false);
  });

  it("rechaza cargos inexistentes (no hay Gerencia)", () => {
    expect(
      ExtractDocumentCommandSchema.safeParse({
        documentRef: "d1",
        documentType: "DPI",
        requestedBy: { userId: "u", offices: ["GERENCIA"] },
      }).success,
    ).toBe(false);
  });
});

describe("hechos del anfitrión y eventos", () => {
  it("valida DocumentUploaded", () => {
    const fact = {
      type: "DocumentUploaded",
      documentAssetId: "doc-1",
      operationId: "op-1",
      checklistCode: "DPI",
      documentType: "DPI",
      uploadedBy: "asesor-1",
      occurredAt: "2026-09-28T10:00:00.000Z",
    };
    expect(HostFactSchema.parse(fact).type).toBe("DocumentUploaded");
    expect(HostFactSchema.safeParse({ ...fact, type: "Otro" }).success).toBe(false);
  });

  it("AiRunFailed solo acepta códigos de error del catálogo", () => {
    const failed = {
      type: "AiRunFailed",
      eventId: "e1",
      schemaVersion: 1,
      runId: "r1",
      occurredAt: "2026-09-28T10:00:00.000Z",
      lab: false,
      task: "EXTRACT",
      errorCode: "AI_PROVIDER_TIMEOUT",
      retryable: true,
    };
    expect(AiEngineEventSchema.safeParse(failed).success).toBe(true);
    expect(AiEngineEventSchema.safeParse({ ...failed, errorCode: "BOOM" }).success).toBe(false);
  });

  it("todo evento lleva eventId (deduplicación del consumidor) y versión de formato", () => {
    const completed = {
      type: "DocumentExtractionCompleted",
      eventId: "e2",
      schemaVersion: 1,
      runId: "r1",
      occurredAt: "2026-09-28T10:00:00.000Z",
      lab: false,
      documentRef: "doc-1",
      extractionId: "x1",
      candidateCount: 2,
      needsAttentionCount: 0,
      injectionSuspected: false,
    };
    expect(AiEngineEventSchema.safeParse(completed).success).toBe(true);
    const { eventId: _eventId, ...withoutId } = completed;
    expect(AiEngineEventSchema.safeParse(withoutId).success).toBe(false);
    expect(AiEngineEventSchema.safeParse({ ...completed, schemaVersion: 2 }).success).toBe(false);
  });
});

describe("AiEngineError", () => {
  it("expone código estable y si es reintentable", () => {
    const timeout = new AiEngineError("AI_PROVIDER_TIMEOUT", "El proveedor no respondió");
    expect(timeout.code).toBe("AI_PROVIDER_TIMEOUT");
    expect(timeout.retryable).toBe(true);
    expect(new AiEngineError("AI_INPUT_ENCRYPTED", "PDF protegido con contraseña").retryable).toBe(false);
    // Una ejecución interrumpida se puede reintentar; una tarea no disponible o un error interno, no.
    expect(new AiEngineError("AI_RUN_INTERRUPTED", "x").retryable).toBe(true);
    expect(new AiEngineError("AI_TASK_UNAVAILABLE", "x").retryable).toBe(false);
    expect(new AiEngineError("AI_INTERNAL", "x").retryable).toBe(false);
  });
});
