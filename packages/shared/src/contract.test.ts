import { describe, expect, it } from "vitest";
import { CAPTURE_AUDIT_ACTION_LABELS, JUSTIFICATION_MIN_LENGTH_SEED } from "./index";

describe("contrato del sprint 2", () => {
  it("cada acción de la bitácora tiene etiqueta en español", () => {
    for (const [action, label] of Object.entries(CAPTURE_AUDIT_ACTION_LABELS)) {
      expect(label.trim().length, action).toBeGreaterThan(0);
    }
    expect(CAPTURE_AUDIT_ACTION_LABELS.OPERATION_SUBMITTED).toBe("Solicitud enviada a revisión");
  });

  it("la semilla de justificación pide un motivo real", () => {
    expect(JUSTIFICATION_MIN_LENGTH_SEED).toBeGreaterThanOrEqual(20);
  });
});
