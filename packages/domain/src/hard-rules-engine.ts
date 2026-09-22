import type { HardRuleSeverity } from "@crece/shared";
import type { CalcResult, FinancialAssessmentInput } from "./calc-engine";

export type HardRuleHit = {
  ruleCode: string;
  severity: HardRuleSeverity;
  message: string;
  exception?: {
    reason: string;
    byUserId: string;
    at: string;
  };
};

export type HardRulesConfig = {
  minPaymentCapacityGTQ: number;
  maxInstallmentToIncomeRatio: number;
  minGuaranteeCoverage: number;
  bureauDelinquencyMonthsThreshold: number;
};

/** Semilla. El valor vivo vive en `hardRules.*` (DB versionada). */
export const DEFAULT_HARD_RULES_CONFIG: HardRulesConfig = {
  minPaymentCapacityGTQ: 0,
  maxInstallmentToIncomeRatio: 0.35,
  minGuaranteeCoverage: 1.0,
  bureauDelinquencyMonthsThreshold: 6,
};

export type HardRulesInput = {
  assessment: FinancialAssessmentInput;
  calcResult: CalcResult;
  declaredPurpose: string;
  bureauDelinquencyMonths?: number;
  config?: Partial<HardRulesConfig>;
};

export function evaluateHardRules(input: HardRulesInput): HardRuleHit[] {
  const config = { ...DEFAULT_HARD_RULES_CONFIG, ...input.config };
  const hits: HardRuleHit[] = [];

  const capacity = Number(input.calcResult.paymentCapacity.amount);
  if (capacity <= config.minPaymentCapacityGTQ) {
    hits.push({
      ruleCode: "CAPACITY_BELOW_MIN",
      severity: "BLOCK",
      message:
        "Capacidad de pago insuficiente — independientemente de garantías reales sólidas, una garantía no compensa la falta de flujo.",
    });
  }

  if (input.calcResult.installmentToIncomeRatio > config.maxInstallmentToIncomeRatio) {
    hits.push({
      ruleCode: "HIGH_INSTALLMENT_RATIO",
      severity: "BLOCK",
      message: "La cuota supera el ratio máximo permitido sobre ingresos.",
    });
  }

  if (
    input.calcResult.guaranteeCoverage !== null &&
    input.calcResult.guaranteeCoverage < config.minGuaranteeCoverage
  ) {
    hits.push({
      ruleCode: "LOW_GUARANTEE_COVERAGE",
      severity: "ALERT",
      message: "La cobertura de garantía está por debajo del mínimo recomendado.",
    });
  }

  if (
    input.bureauDelinquencyMonths !== undefined &&
    input.bureauDelinquencyMonths >= config.bureauDelinquencyMonthsThreshold
  ) {
    hits.push({
      ruleCode: "BUREAU_DELINQUENCY",
      severity: "ALERT",
      message: "El buró reporta mora prolongada.",
    });
  }

  if (input.declaredPurpose.trim().length < 10) {
    hits.push({
      ruleCode: "VAGUE_PURPOSE",
      severity: "ALERT",
      message: "El destino del crédito está poco detallado.",
    });
  }

  return hits;
}

export function hasBlockingRules(hits: HardRuleHit[]): boolean {
  return hits.some((hit) => hit.severity === "BLOCK" && !hit.exception);
}
