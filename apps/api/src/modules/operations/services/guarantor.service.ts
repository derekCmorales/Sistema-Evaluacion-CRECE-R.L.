import { Injectable, NotFoundException } from "@nestjs/common";
import { parseGuarantorInput } from "@crece/application";
import { calculateCreditMetrics, evaluateHardRules } from "@crece/domain";
import { DEFAULT_RATES_CONFIG } from "@crece/shared";
import { InMemoryOperationStore } from "../in-memory-operation.store";

@Injectable()
export class GuarantorService {
  constructor(private readonly store: InMemoryOperationStore) {}

  execute(operationId: string, rawBody: Record<string, unknown>) {
    const parsed = parseGuarantorInput({
      ...rawBody,
      operationId,
    });

    const updatedOperation = this.store.updateGuarantor(operationId, parsed);

    if (!updatedOperation) {
      throw new NotFoundException(`Operación con id ${operationId} no encontrada`);
    }

    /**
     * Si la operación ya tiene assessment y el fiador aporta evaluación financiera,
     * recalcular métricas combinadas para reflejar la garantía adicional.
     */
    if (updatedOperation.assessment && parsed.financialAssessment) {
      const calcResult = calculateCreditMetrics({
        assessment: updatedOperation.assessment,
        amount: updatedOperation.requestedAmount,
        termMonths: updatedOperation.termMonths,
        annualRatePercent:
          updatedOperation.interestRate ?? DEFAULT_RATES_CONFIG.creditAnnualRatePercent,
        guarantorAssessment: parsed.financialAssessment,
      });

      const hardRuleHits = evaluateHardRules({
        assessment: updatedOperation.assessment,
        calcResult,
        declaredPurpose: updatedOperation.purpose,
      });

      this.store.updateCalcResult(operationId, calcResult, hardRuleHits);
    }

    return {
      operationId: updatedOperation.id,
      guarantor: updatedOperation.guarantor,
      guarantorAssessment: updatedOperation.guarantorAssessment,
      updatedAt: updatedOperation.updatedAt,
    };
  }
}
