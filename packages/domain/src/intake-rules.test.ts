import { describe, expect, it } from "vitest";
import {
  InvariantViolationError,
  NotFoundError,
  ValidationError,
  toPersonId,
  toUserId,
} from "@crece/shared";
import { createChecklistItems } from "./checklist-resolver";
import type { Person } from "./entities";
import {
  applyChecklistItem,
  assertPersonEligibleForDraft,
  completeProspectIdentity,
  evaluateWatchlistCoverage,
  mergeChecklistPreservingProgress,
  personBirthStatus,
} from "./intake-rules";

const prospect: Person = {
  id: toPersonId("p-landing"),
  fullName: "Ana López",
  contacts: { phone: "55551234" },
  status: "PROSPECT",
  source: "LANDING",
  interest: "CREDIT",
  createdAt: "2026-09-26T00:00:00.000Z",
};

describe("nacimiento de la persona", () => {
  it("toda persona nace como prospecto", () => {
    expect(personBirthStatus()).toBe("PROSPECT");
  });
});

describe("completar prospecto de la landing", () => {
  it("agrega el DPI al mismo perfil", () => {
    const completed = completeProspectIdentity(prospect, {
      dpi: "2345678900101",
      fullName: "Ana López",
      phone: "55551234",
      interest: "CREDIT",
      registeredByUserId: toUserId("user-asesor"),
    });
    expect(completed.id).toBe(prospect.id);
    expect(completed.dpi).toBe("2345678900101");
    expect(completed.status).toBe("PROSPECT");
    expect(completed.registeredByUserId).toBe("user-asesor");
  });

  it("rechaza completar con un DPI distinto al que ya tiene", () => {
    expect(() =>
      completeProspectIdentity(
        { ...prospect, dpi: "2345678900101" },
        {
          dpi: "1234567890101",
          fullName: "Ana López",
          phone: "55551234",
          interest: "CREDIT",
        },
      ),
    ).toThrow(InvariantViolationError);
  });
});

describe("borrador sin persona", () => {
  it("exige que la persona exista", () => {
    expect(() => assertPersonEligibleForDraft(null)).toThrow(NotFoundError);
  });

  it("exige DPI de 13 dígitos", () => {
    expect(() => assertPersonEligibleForDraft(prospect)).toThrow(ValidationError);
    expect(() =>
      assertPersonEligibleForDraft({ ...prospect, dpi: "2345678900101" }),
    ).not.toThrow();
  });
});

describe("checklist", () => {
  const items = createChecklistItems({
    productType: "WORKING_CAPITAL",
    guaranteeType: "PERSONAL",
    hasGuarantor: false,
  });

  it("un código que no existe da error", () => {
    expect(() =>
      applyChecklistItem(items, { code: "NO_EXISTE", status: "UPLOADED" }),
    ).toThrow(ValidationError);
  });

  it("al agregar fiador conserva el avance de lo ya cargado", () => {
    const advanced = applyChecklistItem(items, {
      code: "DPI",
      status: "CONFIRMED",
      documentId: "doc-dpi",
    });
    const merged = mergeChecklistPreservingProgress(advanced, {
      productType: "WORKING_CAPITAL",
      guaranteeType: "PERSONAL",
      hasGuarantor: true,
    });
    const dpi = merged.find((item) => item.code === "DPI");
    expect(dpi?.status).toBe("CONFIRMED");
    expect(dpi?.documentId).toBe("doc-dpi");
    expect(merged.some((item) => item.code === "GUARANTOR_DPI")).toBe(true);
    expect(merged.find((item) => item.code === "GUARANTOR_DPI")?.status).toBe("PENDING");
  });
});

describe("listas de control", () => {
  const required = ["OFAC", "ONU", "GUATECOMPRAS"] as const;

  it("una coincidencia deja un hueco visible", () => {
    const coverage = evaluateWatchlistCoverage(
      [
        { source: "OFAC", result: "MATCH_FOUND" },
        { source: "ONU", result: "CLEAR" },
        { source: "GUATECOMPRAS", result: "CLEAR" },
      ],
      required,
    );
    expect(coverage.clear).toBe(false);
    expect(coverage.gaps).toEqual([{ source: "OFAC", reason: "MATCH_FOUND" }]);
  });

  it("una revisión manual deja un hueco visible", () => {
    const coverage = evaluateWatchlistCoverage(
      [
        { source: "OFAC", result: "CLEAR" },
        { source: "ONU", result: "CLEAR" },
        { source: "GUATECOMPRAS", result: "PENDING_MANUAL_REVIEW" },
      ],
      required,
    );
    expect(coverage.gaps).toEqual([
      { source: "GUATECOMPRAS", reason: "PENDING_MANUAL_REVIEW" },
    ]);
  });

  it("solo cierra cuando cada lista requerida está CLEAR", () => {
    const coverage = evaluateWatchlistCoverage(
      [
        { source: "OFAC", result: "CLEAR" },
        { source: "ONU", result: "CLEAR" },
        { source: "GUATECOMPRAS", result: "CLEAR" },
      ],
      required,
    );
    expect(coverage.clear).toBe(true);
    expect(coverage.gaps).toEqual([]);
  });

  it("lee las listas requeridas del arreglo de configuración, no de una lista fija interna", () => {
    const coverage = evaluateWatchlistCoverage(
      [{ source: "OFAC", result: "CLEAR" }],
      ["OFAC"],
    );
    expect(coverage.clear).toBe(true);
  });
});
