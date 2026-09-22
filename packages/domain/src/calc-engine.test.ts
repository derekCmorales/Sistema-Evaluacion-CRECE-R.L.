import { describe, expect, it } from "vitest";
import { money } from "@crece/shared";
import { calculateCreditMetrics, hashAssessmentInputs } from "./calc-engine";

describe("calc-engine", () => {
  const baseInput = {
    assessment: {
      monthlySales: 45000,
      monthlyIncome: 18000,
      monthlyExpenses: 9000,
      existingDebtPayment: 1500,
      guaranteeValue: 80000,
    },
    amount: money(40000),
    termMonths: 24,
    annualRatePercent: 18,
  };

  it("calcula cuota con fórmula de amortización francesa", () => {
    const result = calculateCreditMetrics(baseInput);
    expect(Number(result.installment.amount)).toBeGreaterThan(1500);
    expect(Number(result.installment.amount)).toBeLessThan(2500);
  });

  it("calcula capacidad de pago no negativa", () => {
    const result = calculateCreditMetrics(baseInput);
    expect(Number(result.paymentCapacity.amount)).toBeGreaterThanOrEqual(0);
  });

  it("calcula cobertura de garantía", () => {
    const result = calculateCreditMetrics(baseInput);
    expect(result.guaranteeCoverage).toBe(2);
  });

  it("incluye una fila de amortización por mes", () => {
    const result = calculateCreditMetrics(baseInput);
    expect(result.amortizationSchedule).toHaveLength(baseInput.termMonths);
    expect(result.amortizationSchedule[0]).toMatchObject({
      period: 1,
      payment: expect.any(Number),
      principal: expect.any(Number),
      interest: expect.any(Number),
      balance: expect.any(Number),
    });
    expect(result.amortizationSchedule.at(-1)?.balance).toBe(0);
  });

  it("invalida el hash si cambian los insumos", () => {
    const result = calculateCreditMetrics(baseInput);
    expect(result.inputsHash).not.toBe(
      hashAssessmentInputs({ ...baseInput, termMonths: 36 }),
    );
  });

  it("el hash coincide con SHA-256 de Node para el mismo payload", async () => {
    const { createHash } = await import("node:crypto");
    const result = hashAssessmentInputs(baseInput);
    const payload = JSON.stringify({
      assessment: baseInput.assessment,
      amount: baseInput.amount,
      termMonths: baseInput.termMonths,
      annualRatePercent: baseInput.annualRatePercent,
    });
    expect(result).toBe(createHash("sha256").update(payload).digest("hex"));
  });

  it("no expone puntaje ni recomendación", () => {
    const result = calculateCreditMetrics(baseInput);
    expect(result).not.toHaveProperty("score");
    expect(result).not.toHaveProperty("riskBand");
  });
});
