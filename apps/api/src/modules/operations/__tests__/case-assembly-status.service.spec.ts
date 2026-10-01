import { describe, it, expect, beforeEach } from "vitest";
import { NotFoundError, toUserId } from "@crece/shared";
import { InMemoryOperationStore } from "../in-memory-operation.store";
import { CaseAssemblyStatusService } from "../services/case-assembly-status.service";
import { FinancialAssessmentService } from "../services/financial-assessment.service";
import { UpdateChecklistService } from "../services/update-checklist.service";
import { WatchlistService } from "../services/watchlist.service";

describe("CaseAssemblyStatusService", () => {
  let store: InMemoryOperationStore;
  let service: CaseAssemblyStatusService;

  beforeEach(() => {
    store = new InMemoryOperationStore();
    service = new CaseAssemblyStatusService(store);
  });

  const MOCK_OP_ID = "mock-op-101";

  it("reporta expediente no listo cuando el checklist está pendiente", () => {
    const status = service.evaluate(MOCK_OP_ID);

    expect(status.operationId).toBe(MOCK_OP_ID);
    expect(status.checklistComplete).toBe(false);
    expect(status.pendingChecklistCount).toBeGreaterThan(0);
    expect(status.readyForReview).toBe(false);
  });

  it("reporta hasFinancialAssessment=false cuando no hay assessment", () => {
    const status = service.evaluate(MOCK_OP_ID);
    expect(status.hasFinancialAssessment).toBe(false);
  });

  it("reporta hasFinancialAssessment=true después de guardar assessment", () => {
    const assessmentService = new FinancialAssessmentService(store);
    assessmentService.execute(MOCK_OP_ID, {
      monthlySales: 30000,
      monthlyIncome: 12000,
      monthlyExpenses: 6000,
      existingDebtPayment: 800,
    });

    const status = service.evaluate(MOCK_OP_ID);
    expect(status.hasFinancialAssessment).toBe(true);
  });

  it("una revisión manual deja un hueco aunque las tres listas tengan consulta", () => {
    const status = service.evaluate(MOCK_OP_ID);
    expect(status.watchlistChecksCompleted).toBe(false);
    expect(status.watchlistGaps).toEqual([
      { source: "GUATECOMPRAS", reason: "PENDING_MANUAL_REVIEW" },
    ]);
  });

  it("reporta watchlistChecksCompleted=false cuando faltan fuentes", () => {
    const MOCK_OP_102 = "mock-op-102";
    const status = service.evaluate(MOCK_OP_102);
    expect(status.watchlistChecksCompleted).toBe(false);
  });

  it("reporta assembledByUserId y assembledAt después de marcar ensamblaje", () => {
    store.setAssembledBy(MOCK_OP_ID, toUserId("user-advisor-ana"));

    const status = service.evaluate(MOCK_OP_ID);
    expect(status.assembledByUserId).toBe("user-advisor-ana");
    expect(status.assembledAt).toBeDefined();
  });

  it("reporta readyForReview=true solo cuando checklist, assessment y watchlists están completos", () => {
    const checklistService = new UpdateChecklistService(store);
    const assessmentService = new FinancialAssessmentService(store);

    const op = store.get(MOCK_OP_ID)!;
    for (const item of op.checklist) {
      if (item.required) {
        checklistService.execute(MOCK_OP_ID, {
          code: item.code,
          status: "UPLOADED",
          documentId: `doc-${item.code}`,
        });
      }
    }

    assessmentService.execute(MOCK_OP_ID, {
      monthlySales: 50000,
      monthlyIncome: 20000,
      monthlyExpenses: 8000,
      existingDebtPayment: 1000,
    });

    const watchlistService = new WatchlistService(store);
    watchlistService.execute(MOCK_OP_ID, {
      source: "GUATECOMPRAS",
      queryRef: "2345678900101",
      result: "CLEAR",
      checkedByUserId: "user-advisor-ana",
    });

    const status = service.evaluate(MOCK_OP_ID);
    expect(status.checklistComplete).toBe(true);
    expect(status.hasFinancialAssessment).toBe(true);
    expect(status.watchlistChecksCompleted).toBe(true);
    expect(status.readyForReview).toBe(true);
    expect(status.pendingChecklistCount).toBe(0);
  });

  it("lanza NotFoundException si la operación no existe", () => {
    expect(() => service.evaluate("non-existent-id")).toThrow(NotFoundError);
  });
});
