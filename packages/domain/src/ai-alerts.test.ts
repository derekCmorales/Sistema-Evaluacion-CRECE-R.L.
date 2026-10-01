import { describe, expect, it } from "vitest";
import { toUserId } from "@crece/shared";
import {
  assertAlertHasEvidence,
  assertCanApprove,
  assertDecisionAllowedWithAlerts,
  hasUnresolvedAiAlerts,
  resolveAiAlert,
} from "./ai-alerts";
import type { AiAlert } from "./entities";

const reviewer = toUserId("jefe-mario");

const bureauAlert: AiAlert = {
  id: "alert-1",
  type: "BUREAU_MISMATCH",
  message: "La cuota mensual declarada no coincide con el buró",
  evidence: [
    { sourceType: "DOCUMENT", sourceId: "doc-bureau", quote: "Cuota total Q3,200.00", page: 2 },
    { sourceType: "CALC", sourceId: "existingDebtPayment", quote: "Q1,500.00" },
  ],
};

const coherenceAlert: AiAlert = {
  id: "alert-2",
  type: "INCOHERENCE",
  message: "El destino declarado no coincide con la cotización",
  evidence: [{ sourceType: "DOCUMENT", sourceId: "doc-quote", quote: "Compra de vehículo", page: 1 }],
};

describe("evidencia de alertas", () => {
  it("acepta una alerta con evidencia de documento y de cálculo", () => {
    expect(() => assertAlertHasEvidence(bureauAlert)).not.toThrow();
  });

  it("rechaza una alerta sin evidencia", () => {
    expect(() => assertAlertHasEvidence({ ...bureauAlert, evidence: [] })).toThrow(
      "al menos una evidencia",
    );
  });

  it("rechaza evidencia sin cita o sin fuente", () => {
    expect(() =>
      assertAlertHasEvidence({
        ...bureauAlert,
        evidence: [{ sourceType: "POLICY", sourceId: "chunk-1", quote: "  " }],
      }),
    ).toThrow("cita");
    expect(() =>
      assertAlertHasEvidence({
        ...bureauAlert,
        evidence: [{ sourceType: "POLICY", sourceId: "", quote: "Art. 12" }],
      }),
    ).toThrow("fuente");
  });

  it("rechaza página no positiva", () => {
    expect(() =>
      assertAlertHasEvidence({
        ...bureauAlert,
        evidence: [{ sourceType: "DOCUMENT", sourceId: "doc", quote: "x", page: 0 }],
      }),
    ).toThrow("página");
  });
});

describe("resolución de alertas", () => {
  it("confirma una alerta sin exigir motivo", () => {
    const next = resolveAiAlert([bureauAlert], "alert-1", {
      status: "CONFIRMED",
      byUserId: reviewer,
      at: "2026-09-28T10:00:00.000Z",
    });
    expect(next[0]!.resolution).toEqual({
      status: "CONFIRMED",
      byUserId: reviewer,
      at: "2026-09-28T10:00:00.000Z",
    });
  });

  it("descartar sin motivo falla", () => {
    expect(() =>
      resolveAiAlert([bureauAlert], "alert-1", { status: "DISMISSED", reason: "  ", byUserId: reviewer }),
    ).toThrow("exige un motivo");
  });

  it("descartar con motivo guarda el motivo", () => {
    const next = resolveAiAlert([bureauAlert], "alert-1", {
      status: "DISMISSED",
      reason: "El buró incluye un crédito ya cancelado (constancia en expediente)",
      byUserId: reviewer,
    });
    expect(next[0]!.resolution?.reason).toContain("cancelado");
  });

  it("no resuelve dos veces ni alertas inexistentes", () => {
    const once = resolveAiAlert([bureauAlert], "alert-1", { status: "CONFIRMED", byUserId: reviewer });
    expect(() => resolveAiAlert(once, "alert-1", { status: "CONFIRMED", byUserId: reviewer })).toThrow(
      "ya fue resuelta",
    );
    expect(() => resolveAiAlert(once, "nope", { status: "CONFIRMED", byUserId: reviewer })).toThrow(
      "no encontrada",
    );
  });
});

describe("alertas pendientes bloquean aprobar", () => {
  const alerts = [bureauAlert, coherenceAlert];

  it("no aprueba con una alerta pendiente", () => {
    const partial = resolveAiAlert(alerts, "alert-1", { status: "CONFIRMED", byUserId: reviewer });
    expect(hasUnresolvedAiAlerts(partial)).toBe(true);
    expect(() => assertCanApprove(partial)).toThrow("Hay alertas de IA sin resolver");
    expect(() => assertDecisionAllowedWithAlerts("APPROVE", partial)).toThrow();
    expect(() => assertDecisionAllowedWithAlerts("APPROVE_WITH_CHANGES", partial)).toThrow();
  });

  it("devolver y rechazar no se bloquean por alertas pendientes", () => {
    expect(() => assertDecisionAllowedWithAlerts("RETURN", alerts)).not.toThrow();
    expect(() => assertDecisionAllowedWithAlerts("REJECT", alerts)).not.toThrow();
  });

  it("aprueba cuando todas están resueltas", () => {
    let resolved = resolveAiAlert(alerts, "alert-1", { status: "CONFIRMED", byUserId: reviewer });
    resolved = resolveAiAlert(resolved, "alert-2", {
      status: "DISMISSED",
      reason: "Cotización actualizada adjunta",
      byUserId: reviewer,
    });
    expect(() => assertDecisionAllowedWithAlerts("APPROVE", resolved)).not.toThrow();
  });

  it("sin alertas, aprobar no se bloquea", () => {
    expect(() => assertCanApprove([])).not.toThrow();
  });
});
