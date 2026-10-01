import { describe, expect, it } from "vitest";
import { ValidationError } from "@crece/shared";
import { parseOpenDraftOperation } from "./operation-contracts";

describe("operation-contracts", () => {
  const valid = {
    personId: "person-1",
    productType: "WORKING_CAPITAL",
    guaranteeType: "PERSONAL",
    requestedAmount: 40000,
    termMonths: 24,
    purpose: "Inventario de ferretería",
    hasGuarantor: false,
  };

  it("valida una apertura en borrador y guarda el monto como decimal", () => {
    const parsed = parseOpenDraftOperation(valid);
    expect(parsed.requestedAmount).toEqual({ amount: "40000.00", currency: "GTQ" });
    expect(parsed).not.toHaveProperty("createdBy");
  });

  it("falla ante monto no positivo o plazo no entero", () => {
    expect(() => parseOpenDraftOperation({ ...valid, requestedAmount: 0 })).toThrow(ValidationError);
    expect(() => parseOpenDraftOperation({ ...valid, termMonths: 1.5 })).toThrow(ValidationError);
  });

  it("falla sin destino, sin producto válido o sin indicar fiador", () => {
    expect(() => parseOpenDraftOperation({ ...valid, purpose: "" })).toThrow(ValidationError);
    expect(() => parseOpenDraftOperation({ ...valid, productType: "CAR" })).toThrow(ValidationError);
    expect(() => parseOpenDraftOperation({ ...valid, hasGuarantor: "sí" })).toThrow(ValidationError);
  });
});
