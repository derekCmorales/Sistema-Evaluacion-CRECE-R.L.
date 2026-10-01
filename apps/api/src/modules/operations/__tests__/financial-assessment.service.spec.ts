import { describe, it, expect, beforeEach } from "vitest";
import { NotFoundError, ValidationError } from "@crece/shared";
import { InMemoryOperationStore } from "../in-memory-operation.store";
import { FinancialAssessmentService } from "../services/financial-assessment.service";

describe("FinancialAssessmentService", () => {
  let store: InMemoryOperationStore;
  let service: FinancialAssessmentService;

  beforeEach(() => {
    store = new InMemoryOperationStore();
    service = new FinancialAssessmentService(store);
  });

  const MOCK_OP_ID = "mock-op-101";

  it("guarda el assessment y ejecuta cálculo determinístico automáticamente", () => {
    const result = service.execute(MOCK_OP_ID, {
      monthlySales: 45000,
      monthlyIncome: 15000,
      monthlyExpenses: 8000,
      existingDebtPayment: 1200,
      guaranteeValue: 60000,
    });

    expect(result.operationId).toBe(MOCK_OP_ID);
    expect(result.assessment).toBeDefined();
    expect(result.assessment?.monthlySales).toBe(45000);
    expect(result.assessment?.monthlyIncome).toBe(15000);

    expect(result.calcResult).toBeDefined();
    expect(result.calcResult.installment).toBeDefined();
    expect(Number(result.calcResult.installment.amount)).toBeGreaterThan(0);
    expect(result.calcResult.paymentCapacity).toBeDefined();
    expect(result.calcResult.installmentToIncomeRatio).toBeGreaterThan(0);
    expect(result.calcResult.guaranteeCoverage).toBeGreaterThan(0);
    expect(result.calcResult.amortizationSchedule.length).toBe(18);
    expect(result.calcResult.inputsHash).toBeDefined();
  });

  it("evalúa reglas duras junto con el cálculo", () => {
    const result = service.execute(MOCK_OP_ID, {
      monthlySales: 5000,
      monthlyIncome: 2000,
      monthlyExpenses: 1800,
      existingDebtPayment: 500,
    });

    expect(result.hardRuleHits).toBeDefined();
    expect(Array.isArray(result.hardRuleHits)).toBe(true);
  });

  it("persiste calcResult y hardRuleHits en la operación del store", () => {
    service.execute(MOCK_OP_ID, {
      monthlySales: 45000,
      monthlyIncome: 15000,
      monthlyExpenses: 8000,
      existingDebtPayment: 1200,
    });

    const storedOp = store.get(MOCK_OP_ID);
    expect(storedOp?.calcResult).toBeDefined();
    expect(storedOp?.calcResult?.installment).toBeDefined();
    expect(storedOp?.hardRuleHits).toBeDefined();
  });

  it("detecta capacidad de pago insuficiente como regla dura BLOCK", () => {
    const result = service.execute(MOCK_OP_ID, {
      monthlySales: 1000,
      monthlyIncome: 500,
      monthlyExpenses: 400,
      existingDebtPayment: 200,
    });

    const capacityBlock = result.hardRuleHits.find(
      (hit) => hit.ruleCode === "CAPACITY_BELOW_MIN",
    );
    expect(capacityBlock).toBeDefined();
    expect(capacityBlock?.severity).toBe("BLOCK");
  });

  it("un dato no numérico da error en vez de descartarse", () => {
    expect(() =>
      service.execute(MOCK_OP_ID, {
        monthlySales: 10000,
        monthlyIncome: 5000,
        monthlyExpenses: 2000,
        existingDebtPayment: 0,
        guaranteeValue: "doscientos",
      }),
    ).toThrow(ValidationError);
  });

  it("rechaza valores negativos en las cifras financieras", () => {
    expect(() =>
      service.execute(MOCK_OP_ID, {
        monthlySales: -500,
        monthlyIncome: 1000,
        monthlyExpenses: 500,
        existingDebtPayment: 0,
      }),
    ).toThrow(ValidationError);
  });

  it("lanza NotFoundException si la operación no existe", () => {
    expect(() =>
      service.execute("non-existent-id", {
        monthlySales: 10000,
        monthlyIncome: 5000,
        monthlyExpenses: 3000,
        existingDebtPayment: 0,
      }),
    ).toThrow(NotFoundError);
  });

  it("calcula cobertura de garantía cuando se proporciona guaranteeValue", () => {
    const result = service.execute(MOCK_OP_ID, {
      monthlySales: 50000,
      monthlyIncome: 20000,
      monthlyExpenses: 8000,
      existingDebtPayment: 1000,
      guaranteeValue: 75000,
    });

    expect(result.calcResult.guaranteeCoverage).toBe(75000 / 25000);
  });
});
