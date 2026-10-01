import { describe, expect, it } from "vitest";
import {
  auditActionLabel,
  auditDescription,
  can,
  checklistProgress,
  dpiDigits,
  hardRuleTone,
  operationStateTone,
  optionalAmount,
  percent,
  toAmortizationRows,
  watchlistTone,
} from "./view";

describe("helpers de presentación", () => {
  it("cada estado tiene palabra y tono; una coincidencia en listas se ve como peligro", () => {
    expect(watchlistTone("MATCH_FOUND")).toBe("danger");
    expect(watchlistTone("MISSING")).toBe("neutral");
    expect(operationStateTone("RETURNED_TO_ADVISOR")).toBe("warning");
    expect(hardRuleTone("BLOCK")).toBe("danger");
  });

  it("el avance del checklist cuenta solo requisitos obligatorios resueltos", () => {
    expect(
      checklistProgress([
        { required: true, status: "UPLOADED" },
        { required: true, status: "PENDING" },
        { required: true, status: "MISSING_VISIBLE" },
        { required: false, status: "PENDING" },
      ]),
    ).toEqual({ done: 2, total: 3 });
  });

  it("los permisos salen de la matriz que publica la API", () => {
    const matrix = { "operation:edit": ["ADVISOR", "BRANCH_HEAD"] as const } as unknown as Parameters<typeof can>[0];
    expect(can(matrix, ["BRANCH_HEAD"], "operation:edit")).toBe(true);
    expect(can(matrix, ["COUNCIL_MEMBER"], "operation:edit")).toBe(false);
    expect(can(matrix, ["BRANCH_HEAD"], "permiso:inexistente")).toBe(false);
  });

  it("la tabla del motor se adapta a AmortizationTable sin recalcular nada", () => {
    expect(toAmortizationRows([{ period: 1, payment: 100, principal: 80, interest: 20, balance: 920 }])).toEqual([
      { month: 1, payment: 100, capital: 80, interest: 20, balance: 920 },
    ]);
  });

  it("formatos: porcentaje, DPI capturado, monto opcional y bitácora", () => {
    expect(percent(0.2534)).toBe("25.3%");
    expect(percent(null)).toBe("—");
    expect(dpiDigits("2345 67890-0101")).toBe("2345678900101");
    expect(optionalAmount("")).toBeUndefined();
    expect(optionalAmount(0)).toBe(0);
    expect(auditActionLabel("CASE_ASSEMBLED")).toBe("Expediente marcado como armado");
  });
});

describe("bitácora legible", () => {
  it("traduce códigos de requisito, estado y lista a sus etiquetas", () => {
    const labels = { PURPOSE_LETTER: "Carta de destino del crédito" };
    expect(
      auditDescription({ action: "CHECKLIST_ITEM_UPDATED", field: "PURPOSE_LETTER", oldValue: "UPLOADED", newValue: "NOT_APPLICABLE" }, labels),
    ).toBe("Carta de destino del crédito: Cargado → No aplica");
    expect(auditDescription({ action: "WATCHLIST_CHECKED", field: "ONU", newValue: "MATCH_FOUND" }, labels)).toBe(
      "ONU: Coincidencia encontrada",
    );
    expect(auditDescription({ action: "OPERATION_OPENED", field: "requestedAmount", newValue: "40000.00" }, labels)).toBe(
      "Monto solicitado Q40,000.00",
    );
  });
});
