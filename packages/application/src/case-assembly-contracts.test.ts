import { describe, expect, it } from "vitest";
import { ValidationError } from "@crece/shared";
import {
  parseChecklistItemUpdate,
  parseFinancialAssessment,
  parseGuarantor,
  parseWatchlistCheck,
} from "./case-assembly-contracts";

describe("case-assembly-contracts", () => {
  describe("checklist", () => {
    it("acepta un cambio de estado de casilla", () => {
      expect(parseChecklistItemUpdate({ code: "DPI", status: "UPLOADED" })).toMatchObject({
        code: "DPI",
        status: "UPLOADED",
      });
    });

    it("rechaza un estado desconocido o un código vacío", () => {
      expect(() => parseChecklistItemUpdate({ code: "DPI", status: "LISTO" })).toThrow(ValidationError);
      expect(() => parseChecklistItemUpdate({ code: " ", status: "UPLOADED" })).toThrow(ValidationError);
    });
  });

  describe("evaluación financiera", () => {
    const valid = { monthlySales: 30000, monthlyIncome: 12000, monthlyExpenses: 6000, existingDebtPayment: 500 };

    it("valida la captura manual", () => {
      expect(parseFinancialAssessment({ ...valid, guaranteeValue: "60000" })).toMatchObject({
        ...valid,
        guaranteeValue: 60000,
      });
    });

    it("un opcional vacío se omite, pero uno no numérico falla en lugar de descartarse en silencio", () => {
      expect(parseFinancialAssessment({ ...valid, guaranteeValue: "" }).guaranteeValue).toBeUndefined();
      expect(() => parseFinancialAssessment({ ...valid, guaranteeValue: "sesenta mil" })).toThrow(ValidationError);
      expect(() => parseFinancialAssessment({ ...valid, projectedRoiPercent: "alto" })).toThrow(ValidationError);
    });

    it("rechaza negativos y datos obligatorios ausentes", () => {
      expect(() => parseFinancialAssessment({ ...valid, monthlyExpenses: -1 })).toThrow(ValidationError);
      expect(() => parseFinancialAssessment({ ...valid, monthlyIncome: undefined })).toThrow(ValidationError);
    });
  });

  describe("fiador", () => {
    it("basta el nombre; lo demás puede llegar después", () => {
      expect(parseGuarantor({ fullName: "Lucía López" })).toEqual({
        guarantor: { fullName: "Lucía López", dpi: undefined, phone: undefined, relationship: undefined },
        assessment: undefined,
      });
    });

    it("si trae evaluación, sus números se validan", () => {
      expect(() =>
        parseGuarantor({
          fullName: "Lucía López",
          financialAssessment: { monthlyIncome: "x", monthlyExpenses: 0, existingDebtPayment: 0 },
        }),
      ).toThrow(ValidationError);
    });

    it("falla con nombre de menos de 3 caracteres", () => {
      expect(() => parseGuarantor({ fullName: "Lu" })).toThrow(ValidationError);
    });
  });

  describe("listas de control", () => {
    it("valida OFAC, ONU o Guatecompras", () => {
      expect(parseWatchlistCheck({ source: "OFAC", queryRef: "2345678900101", result: "CLEAR" })).toMatchObject({
        source: "OFAC",
        result: "CLEAR",
      });
      expect(() => parseWatchlistCheck({ source: "FBI", queryRef: "x", result: "CLEAR" })).toThrow(ValidationError);
    });

    it("una coincidencia exige nota de qué coincidió", () => {
      expect(() => parseWatchlistCheck({ source: "ONU", queryRef: "x", result: "MATCH_FOUND" })).toThrow(
        ValidationError,
      );
    });
  });
});
