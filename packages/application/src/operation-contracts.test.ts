import { describe, expect, it } from "vitest";
import { ValidationError } from "@crece/shared";
import {
  parseCreateDraftOperation,
  toDraftOperationEntity,
} from "./operation-contracts";

describe("operation-contracts", () => {
  describe("parseCreateDraftOperation", () => {
    it("valida y parsea una solicitud en borrador válida", () => {
      const parsed = parseCreateDraftOperation({
        personId: "person-101",
        productType: "WORKING_CAPITAL",
        guaranteeType: "PERSONAL",
        amount: 35000,
        termMonths: 24,
        purpose: "Compra de mercadería para temporada alta",
        hasGuarantor: false,
        createdBy: "user-asesor-carlos",
      });

      expect(parsed.personId).toBe("person-101");
      expect(parsed.productType).toBe("WORKING_CAPITAL");
      expect(parsed.requestedAmount.amount).toBe("35000.00");
      expect(parsed.termMonths).toBe(24);
      expect(parsed.hasGuarantor).toBe(false);
    });

    it("falla ante monto no positivo o plazo menor a 1", () => {
      expect(() =>
        parseCreateDraftOperation({
          personId: "person-101",
          productType: "WORKING_CAPITAL",
          guaranteeType: "PERSONAL",
          amount: 0,
          termMonths: 12,
          purpose: "Capital de trabajo",
          createdBy: "user-1",
        }),
      ).toThrow(ValidationError);

      expect(() =>
        parseCreateDraftOperation({
          personId: "person-101",
          productType: "WORKING_CAPITAL",
          guaranteeType: "PERSONAL",
          amount: 10000,
          termMonths: 0,
          purpose: "Capital de trabajo",
          createdBy: "user-1",
        }),
      ).toThrow(ValidationError);
    });

    it("falla si no se proporciona el propósito o destino del crédito", () => {
      expect(() =>
        parseCreateDraftOperation({
          personId: "person-101",
          productType: "WORKING_CAPITAL",
          guaranteeType: "PERSONAL",
          amount: 10000,
          termMonths: 12,
          purpose: "  ",
          createdBy: "user-1",
        }),
      ).toThrow(ValidationError);
    });
  });

  describe("toDraftOperationEntity", () => {
    it("crea la operación en estado DRAFT con su checklist resuelto", () => {
      const input = parseCreateDraftOperation({
        personId: "person-101",
        productType: "INVESTMENT",
        guaranteeType: "MORTGAGE",
        amount: 80000,
        termMonths: 36,
        purpose: "Compra de terreno comercial",
        hasGuarantor: true,
        createdBy: "user-asesor",
      });

      const op = toDraftOperationEntity(input, "op-999");
      expect(op.id).toBe("op-999");
      expect(op.state).toBe("DRAFT");
      expect(op.checklist.length).toBeGreaterThan(0);

      // Debe incluir ítems específicos de hipoteca y fiador
      const codes = op.checklist.map((c) => c.code);
      expect(codes).toContain("PROPERTY_DEED");
      expect(codes).toContain("GUARANTOR_DPI");
      expect(codes).toContain("INVESTMENT_PLAN");
    });
  });
});
