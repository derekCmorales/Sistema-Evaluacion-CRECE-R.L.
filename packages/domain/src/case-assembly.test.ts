import { describe, expect, it } from "vitest";
import {
  InvariantViolationError,
  ValidationError,
  WATCHLIST_SOURCES_SEED,
  money,
  toOperationId,
  toPersonId,
  toUserId,
  type WatchlistResult,
  type WatchlistSource,
} from "@crece/shared";
import {
  applyChecklistUpdate,
  applyGuarantor,
  assertCaseEditable,
  evaluateCaseAssembly,
  markAssembled,
  reconcileChecklist,
  summarizeWatchlist,
} from "./case-assembly";
import { createChecklistItems } from "./checklist-resolver";
import type { Operation, WatchlistCheck } from "./entities";

const ana = toUserId("user-ana");

/** Don Marco, ferretería, Q40,000 a 24 meses, sin fiador. */
function donMarco(overrides: Partial<Operation> = {}): Operation {
  return {
    id: toOperationId("op-1"),
    personId: toPersonId("p-1"),
    productType: "WORKING_CAPITAL",
    guaranteeType: "PERSONAL",
    hasGuarantor: false,
    requestedAmount: money(40000),
    termMonths: 24,
    purpose: "Inventario de ferretería",
    state: "DRAFT",
    checklist: createChecklistItems({ productType: "WORKING_CAPITAL", guaranteeType: "PERSONAL", hasGuarantor: false }),
    hardRuleHits: [],
    verdicts: [],
    createdBy: ana,
    createdAt: "2026-09-30T08:00:00.000Z",
    updatedAt: "2026-09-30T08:00:00.000Z",
    ...overrides,
  };
}

function check(source: WatchlistSource, result: WatchlistResult, checkedAt: string): WatchlistCheck {
  return { id: `${source}-${checkedAt}`, source, queryRef: "2345678900101", result, checkedByUserId: ana, checkedAt };
}

const allClear = WATCHLIST_SOURCES_SEED.map((s) => check(s, "CLEAR", "2026-09-30T09:00:00.000Z"));

function assembled(): Operation {
  const op = donMarco({
    assessment: { monthlySales: 30000, monthlyIncome: 12000, monthlyExpenses: 6000, existingDebtPayment: 500 },
    watchlistChecks: allClear,
  });
  return {
    ...op,
    checklist: op.checklist.map((item) => (item.required ? { ...item, status: "UPLOADED" as const } : item)),
  };
}

describe("checklist del expediente", () => {
  it("un código que no está en el checklist falla en lugar de responder éxito sin cambiar nada", () => {
    expect(() => applyChecklistUpdate(donMarco().checklist, { code: "NO_EXISTE", status: "UPLOADED" })).toThrow(
      ValidationError,
    );
  });

  it("«No aplica» sin motivo falla; con motivo queda registrado", () => {
    const items = donMarco().checklist;
    expect(() => applyChecklistUpdate(items, { code: "TAX_DECLARATION", status: "NOT_APPLICABLE" })).toThrow(
      ValidationError,
    );
    expect(() =>
      applyChecklistUpdate(items, { code: "TAX_DECLARATION", status: "NOT_APPLICABLE", notApplicableReason: "   " }),
    ).toThrow(ValidationError);
    const updated = applyChecklistUpdate(items, {
      code: "TAX_DECLARATION",
      status: "NOT_APPLICABLE",
      notApplicableReason: "Pequeño contribuyente sin declaración anual",
    });
    expect(updated.find((i) => i.code === "TAX_DECLARATION")?.notApplicableReason).toBe(
      "Pequeño contribuyente sin declaración anual",
    );
  });

  it("al salir de «No aplica» se borra el motivo anterior", () => {
    const na = applyChecklistUpdate(donMarco().checklist, {
      code: "TAX_DECLARATION",
      status: "NOT_APPLICABLE",
      notApplicableReason: "Sin declaración anual",
    });
    const back = applyChecklistUpdate(na, { code: "TAX_DECLARATION", status: "UPLOADED" });
    expect(back.find((i) => i.code === "TAX_DECLARATION")?.notApplicableReason).toBeUndefined();
  });

  it("al regenerar conserva lo avanzado y agrega lo nuevo como pendiente", () => {
    const progressed = applyChecklistUpdate(donMarco().checklist, { code: "DPI", status: "CONFIRMED" });
    const next = reconcileChecklist(progressed, {
      productType: "WORKING_CAPITAL",
      guaranteeType: "PERSONAL",
      hasGuarantor: true,
    });
    expect(next.find((i) => i.code === "DPI")?.status).toBe("CONFIRMED");
    expect(next.find((i) => i.code === "GUARANTOR_BUREAU")?.status).toBe("PENDING");
  });
});

describe("fiador", () => {
  it("agregar fiador regenera el checklist con DPI, ingresos y buró del fiador", () => {
    const op = applyGuarantor(donMarco(), { guarantor: { fullName: "Lucía López" } });
    const codes = op.checklist.map((i) => i.code);
    expect(op.hasGuarantor).toBe(true);
    expect(codes).toEqual(expect.arrayContaining(["GUARANTOR_DPI", "GUARANTOR_INCOME", "GUARANTOR_BUREAU"]));
  });

  it("normaliza el DPI del fiador a 13 dígitos y rechaza uno inválido", () => {
    const op = applyGuarantor(donMarco(), { guarantor: { fullName: "Lucía López", dpi: "3456 78901 0101" } });
    expect(op.guarantor?.dpi).toBe("3456789010101");
    expect(() => applyGuarantor(donMarco(), { guarantor: { fullName: "Lucía López", dpi: "123" } })).toThrow(
      ValidationError,
    );
  });

  it("con fiador pero sin su evaluación financiera el expediente tiene un hueco", () => {
    const op = applyGuarantor(assembled(), { guarantor: { fullName: "Lucía López" } });
    expect(evaluateCaseAssembly(op, WATCHLIST_SOURCES_SEED).gaps).toContain("GUARANTOR_INCOMPLETE");
  });
});

describe("listas de control", () => {
  it("una coincidencia no cuenta como lista consultada", () => {
    const checks = [...allClear, check("ONU", "MATCH_FOUND", "2026-09-30T10:00:00.000Z")];
    const status = evaluateCaseAssembly({ ...assembled(), watchlistChecks: checks }, WATCHLIST_SOURCES_SEED);
    expect(status.watchlistCleared).toBe(false);
    expect(status.gaps).toContain("WATCHLIST_MATCH");
    expect(status.readyForReview).toBe(false);
  });

  it("una revisión manual pendiente tampoco cuenta", () => {
    const checks = [...allClear, check("GUATECOMPRAS", "PENDING_MANUAL_REVIEW", "2026-09-30T10:00:00.000Z")];
    const status = evaluateCaseAssembly({ ...assembled(), watchlistChecks: checks }, WATCHLIST_SOURCES_SEED);
    expect(status.gaps).toContain("WATCHLIST_PENDING_REVIEW");
    expect(status.readyForReview).toBe(false);
  });

  it("vale la consulta más reciente por fuente", () => {
    const checks = [
      check("OFAC", "PENDING_MANUAL_REVIEW", "2026-09-30T09:00:00.000Z"),
      check("OFAC", "CLEAR", "2026-09-30T11:00:00.000Z"),
    ];
    expect(summarizeWatchlist(checks, ["OFAC"])[0].result).toBe("CLEAR");
  });

  it("una fuente sin consulta queda como faltante", () => {
    const status = evaluateCaseAssembly({ ...assembled(), watchlistChecks: allClear.slice(0, 2) }, WATCHLIST_SOURCES_SEED);
    expect(status.gaps).toEqual(["WATCHLIST_MISSING"]);
  });
});

describe("completitud del expediente", () => {
  it("un borrador recién abierto reporta todos sus huecos", () => {
    const status = evaluateCaseAssembly(donMarco(), WATCHLIST_SOURCES_SEED);
    expect(status.gaps).toEqual(["CHECKLIST_PENDING", "ASSESSMENT_MISSING", "WATCHLIST_MISSING"]);
    expect(status.readyForReview).toBe(false);
  });

  it("con checklist, evaluación y listas limpias queda listo", () => {
    const status = evaluateCaseAssembly(assembled(), WATCHLIST_SOURCES_SEED);
    expect(status.gaps).toEqual([]);
    expect(status.readyForReview).toBe(true);
  });

  it("los faltantes visibles permiten avanzar y se cuentan", () => {
    const op = assembled();
    const withGap = { ...op, checklist: applyChecklistUpdate(op.checklist, { code: "BUSINESS_PHOTOS", status: "MISSING_VISIBLE" }) };
    const status = evaluateCaseAssembly(withGap, WATCHLIST_SOURCES_SEED);
    expect(status.readyForReview).toBe(true);
    expect(status.missingVisibleCount).toBe(1);
  });

  it("solo se marca armado un expediente sin huecos, y queda quién lo armó", () => {
    expect(() => markAssembled(donMarco(), WATCHLIST_SOURCES_SEED, ana, "2026-09-30T12:00:00.000Z")).toThrow(
      InvariantViolationError,
    );
    const op = markAssembled(assembled(), WATCHLIST_SOURCES_SEED, ana, "2026-09-30T12:00:00.000Z");
    expect(op.assembledByUserId).toBe(ana);
    expect(op.assembledAt).toBe("2026-09-30T12:00:00.000Z");
  });

  it("fuera de borrador o devuelto el expediente no se edita", () => {
    expect(() => assertCaseEditable({ state: "UNDER_REVIEW" })).toThrow(InvariantViolationError);
    expect(() => assertCaseEditable({ state: "APPROVED" })).toThrow(InvariantViolationError);
    expect(() => assertCaseEditable({ state: "RETURNED_TO_ADVISOR" })).not.toThrow();
  });
});
