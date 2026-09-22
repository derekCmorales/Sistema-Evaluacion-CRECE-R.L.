import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import {
  DEFAULT_RATES_CONFIG,
  ValidationError,
  money,
  type GuaranteeType,
  type ProductType,
} from "@crece/shared";
import {
  calculateCreditMetrics,
  createChecklistItems,
  evaluateHardRules,
} from "@crece/domain";

const PRODUCTS: ProductType[] = [
  "WORKING_CAPITAL",
  "INVESTMENT",
  "MICROCREDIT",
];
const GUARANTEES: GuaranteeType[] = ["MORTGAGE", "PLEDGE", "PERSONAL", "MIXED"];

@Controller("operations")
export class OperationsController {
  @Get()
  listStub() {
    return {
      message:
        "Listado persistido pendiente de Prisma. Use GET /operations/checklist y POST /operations/calc.",
      items: [],
    };
  }

  @Get("checklist")
  checklist(
    @Query("productType") productType: string,
    @Query("guaranteeType") guaranteeType: string,
    @Query("hasGuarantor") hasGuarantor?: string,
  ) {
    if (!PRODUCTS.includes(productType as ProductType)) {
      throw new ValidationError("productType inválido");
    }
    if (!GUARANTEES.includes(guaranteeType as GuaranteeType)) {
      throw new ValidationError("guaranteeType inválido");
    }
    const items = createChecklistItems({
      productType: productType as ProductType,
      guaranteeType: guaranteeType as GuaranteeType,
      hasGuarantor: hasGuarantor === "true",
    });
    return { items, count: items.length };
  }

  @Post("calc")
  calc(@Body() body: CalcBody) {
    const amount = Number(body.amount);
    const termMonths = Number(body.termMonths);
    const annualRatePercent =
      Number(body.annualRatePercent) ||
      DEFAULT_RATES_CONFIG.creditAnnualRatePercent;
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new ValidationError("amount debe ser un número positivo");
    }
    if (!Number.isFinite(termMonths) || termMonths < 1) {
      throw new ValidationError("termMonths debe ser ≥ 1");
    }
    const assessment = {
      monthlySales: Number(body.assessment?.monthlySales ?? 0),
      monthlyIncome: Number(body.assessment?.monthlyIncome ?? 0),
      monthlyExpenses: Number(body.assessment?.monthlyExpenses ?? 0),
      existingDebtPayment: Number(body.assessment?.existingDebtPayment ?? 0),
      guaranteeValue: body.assessment?.guaranteeValue
        ? Number(body.assessment.guaranteeValue)
        : undefined,
      projectedRoiPercent: body.assessment?.projectedRoiPercent
        ? Number(body.assessment.projectedRoiPercent)
        : undefined,
    };
    const calcResult = calculateCreditMetrics({
      assessment,
      amount: money(amount),
      termMonths,
      annualRatePercent,
    });
    const hardRuleHits = evaluateHardRules({
      assessment,
      calcResult,
      declaredPurpose: String(body.purpose ?? ""),
      bureauDelinquencyMonths: body.bureauDelinquencyMonths,
    });
    return { calcResult, hardRuleHits };
  }
}

type CalcBody = {
  amount?: number;
  termMonths?: number;
  annualRatePercent?: number;
  purpose?: string;
  bureauDelinquencyMonths?: number;
  assessment?: {
    monthlySales?: number;
    monthlyIncome?: number;
    monthlyExpenses?: number;
    existingDebtPayment?: number;
    guaranteeValue?: number;
    projectedRoiPercent?: number;
  };
};
