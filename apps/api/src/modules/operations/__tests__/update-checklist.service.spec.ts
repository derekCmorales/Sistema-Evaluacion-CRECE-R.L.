import { describe, it, expect, beforeEach } from "vitest";
import { NotFoundError, ValidationError } from "@crece/shared";
import { InMemoryOperationStore } from "../in-memory-operation.store";
import { UpdateChecklistService } from "../services/update-checklist.service";

describe("UpdateChecklistService", () => {
  let store: InMemoryOperationStore;
  let service: UpdateChecklistService;

  beforeEach(() => {
    store = new InMemoryOperationStore();
    service = new UpdateChecklistService(store);
  });

  const MOCK_OP_ID = "mock-op-101";

  it("actualiza un ítem del checklist a UPLOADED con documentId", () => {
    const result = service.execute(MOCK_OP_ID, {
      code: "DPI",
      status: "UPLOADED",
      documentId: "doc-abc-123",
    });

    expect(result.operationId).toBe(MOCK_OP_ID);
    const dpiItem = result.checklist.find((item) => item.code === "DPI");
    expect(dpiItem?.status).toBe("UPLOADED");
    expect(dpiItem?.documentId).toBe("doc-abc-123");
  });

  it("actualiza un ítem a CONFIRMED", () => {
    const result = service.execute(MOCK_OP_ID, {
      code: "BUREAU",
      status: "CONFIRMED",
    });

    const bureauItem = result.checklist.find((item) => item.code === "BUREAU");
    expect(bureauItem?.status).toBe("CONFIRMED");
  });

  it("permite marcar NOT_APPLICABLE con justificación válida (≥5 chars)", () => {
    const result = service.execute(MOCK_OP_ID, {
      code: "SPOUSE_DPI",
      status: "NOT_APPLICABLE",
      notApplicableReason: "Solicitante soltero sin cónyuge",
    });

    const spouseItem = result.checklist.find((item) => item.code === "SPOUSE_DPI");
    expect(spouseItem?.status).toBe("NOT_APPLICABLE");
    expect(spouseItem?.notApplicableReason).toContain("soltero");
  });

  it("rechaza NOT_APPLICABLE sin justificación (regla de negocio obligatoria)", () => {
    expect(() =>
      service.execute(MOCK_OP_ID, {
        code: "SPOUSE_DPI",
        status: "NOT_APPLICABLE",
      }),
    ).toThrow(ValidationError);
  });

  it("rechaza NOT_APPLICABLE con justificación menor a 5 caracteres", () => {
    expect(() =>
      service.execute(MOCK_OP_ID, {
        code: "SPOUSE_DPI",
        status: "NOT_APPLICABLE",
        notApplicableReason: "abc",
      }),
    ).toThrow(ValidationError);
  });

  it("actualiza un ítem a MISSING_VISIBLE", () => {
    const result = service.execute(MOCK_OP_ID, {
      code: "TAX_DECLARATION",
      status: "MISSING_VISIBLE",
    });

    const taxItem = result.checklist.find((item) => item.code === "TAX_DECLARATION");
    expect(taxItem?.status).toBe("MISSING_VISIBLE");
  });

  it("lanza NotFoundException si la operación no existe", () => {
    expect(() =>
      service.execute("non-existent-id", {
        code: "DPI",
        status: "UPLOADED",
      }),
    ).toThrow(NotFoundError);
  });

  it("un código que no existe da error", () => {
    expect(() =>
      service.execute(MOCK_OP_ID, {
        code: "NO_EXISTE",
        status: "UPLOADED",
      }),
    ).toThrow(ValidationError);
  });

  it("rechaza un estado de checklist inválido", () => {
    expect(() =>
      service.execute(MOCK_OP_ID, {
        code: "DPI",
        status: "INVALID_STATUS",
      }),
    ).toThrow(ValidationError);
  });
});
