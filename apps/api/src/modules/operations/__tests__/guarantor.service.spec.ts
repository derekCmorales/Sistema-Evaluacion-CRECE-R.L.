import { describe, it, expect, beforeEach } from "vitest";
import { NotFoundException } from "@nestjs/common";
import { ValidationError } from "@crece/shared";
import { InMemoryOperationStore } from "../in-memory-operation.store";
import { GuarantorService } from "../services/guarantor.service";
import { FinancialAssessmentService } from "../services/financial-assessment.service";

describe("GuarantorService", () => {
  let store: InMemoryOperationStore;
  let service: GuarantorService;

  beforeEach(() => {
    store = new InMemoryOperationStore();
    service = new GuarantorService(store);
  });

  const MOCK_OP_ID = "mock-op-101";

  it("registra un fiador con datos mínimos (tolerante a parcialidad)", () => {
    const result = service.execute(MOCK_OP_ID, {
      fullName: "Roberto Carlos Morales",
    });

    expect(result.operationId).toBe(MOCK_OP_ID);
    expect(result.guarantor?.fullName).toBe("Roberto Carlos Morales");
  });

  it("registra un fiador con datos completos", () => {
    const result = service.execute(MOCK_OP_ID, {
      fullName: "Roberto Carlos Morales",
      dpi: "9876543210101",
      phone: "55557766",
      relationship: "Hermano",
      financialAssessment: {
        monthlyIncome: 8000,
        monthlyExpenses: 4000,
        existingDebtPayment: 500,
        guaranteeValue: 50000,
      },
      bureauDocumentId: "bureau-doc-001",
      notes: "Fiador con trabajo estable",
    });

    expect(result.guarantor?.fullName).toBe("Roberto Carlos Morales");
    expect(result.guarantor?.dpi).toBe("9876543210101");
    expect(result.guarantor?.relationship).toBe("Hermano");
    expect(result.guarantorAssessment?.monthlyIncome).toBe(8000);
  });

  it("recalcula métricas cuando la operación ya tiene assessment y el fiador aporta evaluación", () => {
    const assessmentService = new FinancialAssessmentService(store);
    assessmentService.execute(MOCK_OP_ID, {
      monthlySales: 45000,
      monthlyIncome: 15000,
      monthlyExpenses: 8000,
      existingDebtPayment: 1200,
      guaranteeValue: 30000,
    });

    service.execute(MOCK_OP_ID, {
      fullName: "Ana María López",
      financialAssessment: {
        monthlyIncome: 10000,
        monthlyExpenses: 5000,
        existingDebtPayment: 0,
        guaranteeValue: 40000,
      },
    });

    const storedOp = store.get(MOCK_OP_ID);
    expect(storedOp?.calcResult).toBeDefined();
    // La cobertura combinada debe incluir garantía del fiador (30000 + 40000 = 70000 / 25000)
    expect(storedOp?.calcResult?.guaranteeCoverage).toBe(70000 / 25000);
  });

  it("rechaza nombre del fiador con menos de 3 caracteres", () => {
    expect(() =>
      service.execute(MOCK_OP_ID, {
        fullName: "AB",
      }),
    ).toThrow(ValidationError);
  });

  it("lanza NotFoundException si la operación no existe", () => {
    expect(() =>
      service.execute("non-existent-id", {
        fullName: "Nombre Completo Válido",
      }),
    ).toThrow(NotFoundException);
  });

  it("permite registrar fiador sin evaluación financiera", () => {
    const result = service.execute(MOCK_OP_ID, {
      fullName: "Carlos Hernández",
      phone: "55551234",
    });

    expect(result.guarantor?.fullName).toBe("Carlos Hernández");
    expect(result.guarantorAssessment).toBeUndefined();
  });
});
