import type { Money } from "@crece/shared";
import { sha256Hex } from "./sha256";

export type FinancialAssessmentInput = {
  monthlySales: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  existingDebtPayment: number;
  guaranteeValue?: number;
  projectedRoiPercent?: number;
  rawFields?: Record<string, string | number>;
};

export type GuarantorAssessmentInput = {
  monthlyIncome: number;
  monthlyExpenses: number;
  existingDebtPayment: number;
  guaranteeValue?: number;
};

export type AmortizationRow = {
  period: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
};

export type CalcEngineInput = {
  assessment: FinancialAssessmentInput;
  amount: Money;
  termMonths: number;
  annualRatePercent: number;
  guarantorAssessment?: GuarantorAssessmentInput;
};

export type CalcResult = {
  installment: Money;
  paymentCapacity: Money;
  installmentToIncomeRatio: number;
  guaranteeCoverage: number | null;
  roiPercent: number | null;
  amortizationSchedule: AmortizationRow[];
  computedAt: string;
  inputsHash: string;
};

function roundMoney(value: number): string {
  return value.toFixed(2);
}

export function hashAssessmentInputs(input: CalcEngineInput): string {
  const payload = JSON.stringify({
    assessment: input.assessment,
    amount: input.amount,
    termMonths: input.termMonths,
    annualRatePercent: input.annualRatePercent,
    guarantorAssessment: input.guarantorAssessment,
  });
  return sha256Hex(payload);
}

export function buildAmortizationSchedule(
  principal: number,
  termMonths: number,
  annualRatePercent: number,
): AmortizationRow[] {
  const monthlyRate = annualRatePercent / 100 / 12;
  const installmentValue =
    monthlyRate === 0
      ? principal / termMonths
      : (principal * monthlyRate * (1 + monthlyRate) ** termMonths) /
        ((1 + monthlyRate) ** termMonths - 1);

  const schedule: AmortizationRow[] = [];
  let balance = principal;

  for (let period = 1; period <= termMonths; period++) {
    const interest = monthlyRate === 0 ? 0 : balance * monthlyRate;
    const principalPaid =
      period === termMonths ? balance : installmentValue - interest;
    balance = Math.max(balance - principalPaid, 0);
    schedule.push({
      period,
      payment: installmentValue,
      principal: principalPaid,
      interest,
      balance,
    });
  }

  return schedule;
}

/**
 * Motor determinístico: cuota francesa, capacidad, ratio, cobertura, ROI.
 * No genera puntaje ni recomendación de aprobación.
 */
export function calculateCreditMetrics(input: CalcEngineInput): CalcResult {
  const { assessment, amount, termMonths, annualRatePercent, guarantorAssessment } =
    input;
  const principal = Number(amount.amount);
  const monthlyRate = annualRatePercent / 100 / 12;

  const installmentValue =
    monthlyRate === 0
      ? principal / termMonths
      : (principal * monthlyRate * (1 + monthlyRate) ** termMonths) /
        ((1 + monthlyRate) ** termMonths - 1);

  const disposableIncome =
    assessment.monthlyIncome -
    assessment.monthlyExpenses -
    assessment.existingDebtPayment;
  const paymentCapacity = Math.max(disposableIncome - installmentValue, 0);
  const installmentToIncomeRatio =
    assessment.monthlyIncome > 0 ? installmentValue / assessment.monthlyIncome : 1;

  let totalGuarantee =
    assessment.guaranteeValue && assessment.guaranteeValue > 0
      ? assessment.guaranteeValue
      : 0;
  if (guarantorAssessment?.guaranteeValue) {
    totalGuarantee += guarantorAssessment.guaranteeValue;
  }

  const guaranteeCoverage =
    totalGuarantee > 0 ? totalGuarantee / principal : null;

  return {
    installment: { amount: roundMoney(installmentValue), currency: "GTQ" },
    paymentCapacity: { amount: roundMoney(paymentCapacity), currency: "GTQ" },
    installmentToIncomeRatio,
    guaranteeCoverage,
    roiPercent: assessment.projectedRoiPercent ?? null,
    amortizationSchedule: buildAmortizationSchedule(
      principal,
      termMonths,
      annualRatePercent,
    ),
    computedAt: new Date().toISOString(),
    inputsHash: hashAssessmentInputs(input),
  };
}

export function isCalcResultValid(
  result: CalcResult,
  input: CalcEngineInput,
): boolean {
  return result.inputsHash === hashAssessmentInputs(input);
}

export const calcEngine = {
  calculate: calculateCreditMetrics,
  hashInputs: hashAssessmentInputs,
};
