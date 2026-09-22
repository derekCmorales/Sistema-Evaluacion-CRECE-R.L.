import { describe, expect, it } from "vitest";
import {
  DEFAULT_DECISION_FACTORS,
  assertFactorsValid,
  validateFactorCodes,
} from "./decision-factors";

describe("decision-factors", () => {
  it("siembra 12 factores sin pesos", () => {
    expect(DEFAULT_DECISION_FACTORS).toHaveLength(12);
    expect(DEFAULT_DECISION_FACTORS.some((f) => f.code === "LIVING_CONDITIONS")).toBe(
      true,
    );
    expect(DEFAULT_DECISION_FACTORS.every((f) => !("weight" in f))).toBe(true);
  });

  it("rechaza factores inactivos o desconocidos", () => {
    const catalog = DEFAULT_DECISION_FACTORS.map((f) =>
      f.code === "REFERENCES" ? { ...f, active: false } : f,
    );
    expect(validateFactorCodes(["PAYMENT_CAPACITY", "REFERENCES"], catalog)).toEqual([
      "PAYMENT_CAPACITY",
    ]);
    expect(() => assertFactorsValid(["SCORE_85"], catalog)).toThrow(/inválido/);
  });
});
