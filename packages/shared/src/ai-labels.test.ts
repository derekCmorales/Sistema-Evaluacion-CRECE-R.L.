import { describe, expect, it } from "vitest";
import {
  AI_ALERT_RESOLUTION_LABELS,
  AI_ALERT_TYPES,
  AI_ALERT_TYPE_LABELS,
  EVIDENCE_SOURCE_TYPES,
  EVIDENCE_SOURCE_TYPE_LABELS,
} from "./index";

describe("labels de IA", () => {
  it("todo tipo de alerta tiene label es-GT no vacío", () => {
    for (const type of AI_ALERT_TYPES) {
      expect(AI_ALERT_TYPE_LABELS[type]?.trim()).toBeTruthy();
    }
    expect(Object.keys(AI_ALERT_TYPE_LABELS).sort()).toEqual([...AI_ALERT_TYPES].sort());
  });

  it("todo tipo de fuente de evidencia tiene label", () => {
    for (const source of EVIDENCE_SOURCE_TYPES) {
      expect(EVIDENCE_SOURCE_TYPE_LABELS[source]?.trim()).toBeTruthy();
    }
  });

  it("las resoluciones tienen label", () => {
    expect(AI_ALERT_RESOLUTION_LABELS.CONFIRMED).toBe("Confirmada");
    expect(AI_ALERT_RESOLUTION_LABELS.DISMISSED).toBe("Descartada");
  });

  it("ningún label sugiere puntaje ni recomendación", () => {
    const all = [
      ...Object.values(AI_ALERT_TYPE_LABELS),
      ...Object.values(EVIDENCE_SOURCE_TYPE_LABELS),
    ].join(" ").toLowerCase();
    expect(all).not.toMatch(/score|puntaje|recomend|riesgo (alto|medio|bajo)/);
  });
});
