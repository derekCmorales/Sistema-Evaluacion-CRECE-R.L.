import { describe, expect, it } from "vitest";
import { money } from "@crece/shared";
import { calculateCreditMetrics } from "./calc-engine";
import { evaluateHardRules, hasBlockingRules } from "./hard-rules-engine";

const healthy = calculateCreditMetrics({
  assessment: {
    monthlySales: 45000,
    monthlyIncome: 18000,
    monthlyExpenses: 4000,
    existingDebtPayment: 500,
    guaranteeValue: 80000,
  },
  amount: money(40000),
  termMonths: 24,
  annualRatePercent: 18,
});

describe("hard-rules-engine", () => {
  it("alerta destino vago y no bloquea", () => {
    const hits = evaluateHardRules({
      assessment: {
        monthlySales: 45000,
        monthlyIncome: 18000,
        monthlyExpenses: 4000,
        existingDebtPayment: 500,
        guaranteeValue: 80000,
      },
      calcResult: healthy,
      declaredPurpose: "giro",
    });
    expect(hits.some((h) => h.ruleCode === "VAGUE_PURPOSE")).toBe(true);
    expect(hasBlockingRules(hits)).toBe(false);
  });

  it("bloquea capacidad insuficiente con la redacción de CRECE", () => {
    const poor = calculateCreditMetrics({
      assessment: {
        monthlySales: 1000,
        monthlyIncome: 1000,
        monthlyExpenses: 900,
        existingDebtPayment: 200,
        guaranteeValue: 200000,
      },
      amount: money(40000),
      termMonths: 12,
      annualRatePercent: 18,
    });
    const hits = evaluateHardRules({
      assessment: {
        monthlySales: 1000,
        monthlyIncome: 1000,
        monthlyExpenses: 900,
        existingDebtPayment: 200,
        guaranteeValue: 200000,
      },
      calcResult: poor,
      declaredPurpose: "Capital de trabajo para inventario",
    });
    const capacity = hits.find((h) => h.ruleCode === "CAPACITY_BELOW_MIN");
    expect(capacity?.severity).toBe("BLOCK");
    expect(capacity?.message).toMatch(/garantía no compensa/i);
    expect(hasBlockingRules(hits)).toBe(true);
  });

  it("una excepción justificada quita el bloqueo", () => {
    const hits = evaluateHardRules({
      assessment: {
        monthlySales: 1000,
        monthlyIncome: 1000,
        monthlyExpenses: 900,
        existingDebtPayment: 200,
      },
      calcResult: calculateCreditMetrics({
        assessment: {
          monthlySales: 1000,
          monthlyIncome: 1000,
          monthlyExpenses: 900,
          existingDebtPayment: 200,
        },
        amount: money(40000),
        termMonths: 12,
        annualRatePercent: 18,
      }),
      declaredPurpose: "Capital de trabajo para inventario",
    }).map((hit) =>
      hit.severity === "BLOCK"
        ? {
            ...hit,
            exception: {
              reason: "Flujo estacional documentado",
              byUserId: "mario",
              at: new Date().toISOString(),
            },
          }
        : hit,
    );
    expect(hasBlockingRules(hits)).toBe(false);
  });
});
