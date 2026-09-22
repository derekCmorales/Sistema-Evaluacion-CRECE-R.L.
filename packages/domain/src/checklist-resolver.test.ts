import { describe, expect, it } from "vitest";
import {
  createChecklistItems,
  isChecklistReadyForReview,
  resolveChecklistTemplate,
} from "./checklist-resolver";

describe("checklist-resolver", () => {
  it("resuelve casillas por producto, garantía y fiador", () => {
    const items = resolveChecklistTemplate({
      productType: "WORKING_CAPITAL",
      guaranteeType: "MORTGAGE",
      hasGuarantor: true,
    });
    const codes = items.map((i) => i.code);
    expect(codes).toContain("DPI");
    expect(codes).toContain("BUREAU_CONSENT");
    expect(codes).toContain("PURPOSE_LETTER");
    expect(codes).toContain("PROPERTY_DEED");
    expect(codes).toContain("GUARANTOR_DPI");
  });

  it("no exige fiador si hasGuarantor es false", () => {
    const items = resolveChecklistTemplate({
      productType: "MICROCREDIT",
      guaranteeType: "PERSONAL",
      hasGuarantor: false,
    });
    expect(items.some((i) => i.code.startsWith("GUARANTOR_"))).toBe(false);
  });

  it("permite avanzar con faltante visible", () => {
    const items = createChecklistItems({
      productType: "WORKING_CAPITAL",
      guaranteeType: "PERSONAL",
      hasGuarantor: false,
    }).map((item) =>
      item.required ? { ...item, status: "MISSING_VISIBLE" as const } : item,
    );
    expect(isChecklistReadyForReview(items)).toBe(true);
  });

  it("N/A sin razón no está listo", () => {
    const items = createChecklistItems({
      productType: "WORKING_CAPITAL",
      guaranteeType: "PERSONAL",
      hasGuarantor: false,
    }).map((item) =>
      item.required ? { ...item, status: "NOT_APPLICABLE" as const } : item,
    );
    expect(isChecklistReadyForReview(items)).toBe(false);
    const withReason = items.map((item) =>
      item.status === "NOT_APPLICABLE"
        ? { ...item, notApplicableReason: "No aplica al producto" }
        : item,
    );
    expect(isChecklistReadyForReview(withReason)).toBe(true);
  });
});
