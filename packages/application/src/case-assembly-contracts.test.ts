import { describe, expect, it } from "vitest";
import { ValidationError } from "@crece/shared";
import {
  parseFinancialAssessmentInput,
  parseGuarantorInput,
  parseUpdateChecklistItem,
  parseWatchlistCheckInput,
} from "./case-assembly-contracts";

describe("case-assembly-contracts", () => {
  describe("parseUpdateChecklistItem", () => {
    it("permite cargar documento con estado UPLOADED", () => {
      const parsed = parseUpdateChecklistItem({
        operationId: "op-101",
        code: "DPI",
        status: "UPLOADED",
        documentId: "doc-555",
      });

      expect(parsed.operationId).toBe("op-101");
      expect(parsed.code).toBe("DPI");
      expect(parsed.status).toBe("UPLOADED");
      expect(parsed.documentId).toBe("doc-555");
    });

    it("EXIGE justificación si se marca como NOT_APPLICABLE (Regla de instrucciones.txt)", () => {
      expect(() =>
        parseUpdateChecklistItem({
          operationId: "op-101",
          code: "TAX_DECLARATION",
          status: "NOT_APPLICABLE",
        }),
      ).toThrow(ValidationError);

      expect(() =>
        parseUpdateChecklistItem({
          operationId: "op-101",
          code: "TAX_DECLARATION",
          status: "NOT_APPLICABLE",
          notApplicableReason: "na", // Demasiado corto
        }),
      ).toThrow(ValidationError);

      const validNA = parseUpdateChecklistItem({
        operationId: "op-101",
        code: "TAX_DECLARATION",
        status: "NOT_APPLICABLE",
        notApplicableReason: "El solicitante tributa en régimen de pequeño contribuyente exento de balance general",
      });

      expect(validNA.status).toBe("NOT_APPLICABLE");
      expect(validNA.notApplicableReason).toContain("pequeño contribuyente");
    });
  });

  describe("parseFinancialAssessmentInput", () => {
    it("valida la captura manual de finanzas", () => {
      const parsed = parseFinancialAssessmentInput({
        operationId: "op-101",
        monthlySales: 45000,
        monthlyIncome: 15000,
        monthlyExpenses: 8000,
        existingDebtPayment: 1200,
        guaranteeValue: 60000,
      });

      expect(parsed.monthlySales).toBe(45000);
      expect(parsed.monthlyIncome).toBe(15000);
      expect(parsed.monthlyExpenses).toBe(8000);
      expect(parsed.existingDebtPayment).toBe(1200);
      expect(parsed.guaranteeValue).toBe(60000);
    });

    it("rechaza valores negativos", () => {
      expect(() =>
        parseFinancialAssessmentInput({
          operationId: "op-101",
          monthlySales: -500,
          monthlyIncome: 1000,
          monthlyExpenses: 500,
          existingDebtPayment: 0,
        }),
      ).toThrow(ValidationError);
    });
  });

  describe("parseGuarantorInput", () => {
    it("permite registrar datos de fiador con flexibilidad", () => {
      const parsed = parseGuarantorInput({
        operationId: "op-101",
        fullName: "Roberto Carlos Morales",
        phone: "55557766",
        relationship: "Hermano",
        financialAssessment: {
          monthlyIncome: 8000,
          monthlyExpenses: 4000,
          existingDebtPayment: 500,
        },
      });

      expect(parsed.fullName).toBe("Roberto Carlos Morales");
      expect(parsed.relationship).toBe("Hermano");
      expect(parsed.financialAssessment?.monthlyIncome).toBe(8000);
    });

    it("falla si el nombre del fiador no tiene al menos 3 caracteres", () => {
      expect(() =>
        parseGuarantorInput({
          operationId: "op-101",
          fullName: "A",
        }),
      ).toThrow(ValidationError);
    });
  });

  describe("parseWatchlistCheckInput", () => {
    it("valida consultas a OFAC, ONU o Guatecompras", () => {
      const parsed = parseWatchlistCheckInput({
        operationId: "op-101",
        source: "OFAC",
        queryRef: "2345678900101",
        result: "CLEAR",
        checkedByUserId: "user-asesor-mario",
        notes: "Sin coincidencias en lista SDN",
      });

      expect(parsed.source).toBe("OFAC");
      expect(parsed.result).toBe("CLEAR");
      expect(parsed.checkedByUserId).toBe("user-asesor-mario");
    });

    it("rechaza fuentes de consulta desconocidas", () => {
      expect(() =>
        parseWatchlistCheckInput({
          operationId: "op-101",
          source: "OTRA_LISTA",
          queryRef: "123",
          result: "CLEAR",
          checkedByUserId: "user-1",
        }),
      ).toThrow(ValidationError);
    });
  });
});
