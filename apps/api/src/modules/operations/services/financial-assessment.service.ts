import { Injectable, NotFoundException } from "@nestjs/common";
import { parseFinancialAssessmentInput } from "@crece/application";
import {
  calculateCreditMetrics,
  evaluateHardRules,
} from "@crece/domain";
import { DEFAULT_RATES_CONFIG, money } from "@crece/shared";
import { InMemoryOperationStore } from "../in-memory-operation.store";

@Injectable()
export class FinancialAssessmentService {
  constructor(private readonly store: InMemoryOperationStore) {}

  execute(operationId: string, rawBody: Record<string, unknown>) {
    const parsed = parseFinancialAssessmentInput({
      ...rawBody,
      operationId,
    });

    const updatedOperation = this.store.updateAssessment(operationId, parsed);

    if (!updatedOperation) {
      throw new NotFoundException(`Operación con id ${operationId} no encontrada`);
    }

    const assessmentForCalc = {
      monthlySales: parsed.monthlySales,
      monthlyIncome: parsed.monthlyIncome,
      monthlyExpenses: parsed.monthlyExpenses,
      existingDebtPayment: parsed.existingDebtPayment,
      guaranteeValue: parsed.guaranteeValue,
      projectedRoiPercent: parsed.projectedRoiPercent,
    };

    const calcResult = calculateCreditMetrics({
      assessment: assessmentForCalc,
      amount: updatedOperation.requestedAmount,
      termMonths: updatedOperation.termMonths,
      annualRatePercent:
        updatedOperation.interestRate ?? DEFAULT_RATES_CONFIG.creditAnnualRatePercent,
      guarantorAssessment: updatedOperation.guarantorAssessment,
    });

    const hardRuleHits = evaluateHardRules({
      assessment: assessmentForCalc,
      calcResult,
      declaredPurpose: updatedOperation.purpose,
    });

    const operationWithCalc = this.store.updateCalcResult(
      operationId,
      calcResult,
      hardRuleHits,
    );

    return {
      operationId: updatedOperation.id,
      assessment: updatedOperation.assessment,
      calcResult: operationWithCalc?.calcResult ?? calcResult,
      hardRuleHits: operationWithCalc?.hardRuleHits ?? hardRuleHits,
      updatedAt: operationWithCalc?.updatedAt ?? updatedOperation.updatedAt,
    };
  }
}
