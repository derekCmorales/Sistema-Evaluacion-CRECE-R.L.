import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import {
  DEFAULT_RATES_CONFIG,
  ValidationError,
  money,
  type Actor,
  type GuaranteeType,
  type ProductType,
} from "@crece/shared";
import {
  calculateCreditMetrics,
  createChecklistItems,
  evaluateHardRules,
} from "@crece/domain";
import {
  getCaseFile,
  getOperationHistory,
  listCaseFiles,
  markCaseAssembled,
  openDraftOperation,
  recordFinancialAssessment,
  recordWatchlistCheck,
  setGuarantor,
  updateChecklistItem,
  type CaptureDeps,
} from "@crece/application";
import { CurrentActor } from "../../common/current-actor";
import { CAPTURE_DEPS } from "../capture/capture.tokens";

const PRODUCTS: ProductType[] = [
  "WORKING_CAPITAL",
  "INVESTMENT",
  "MICROCREDIT",
];
const GUARANTEES: GuaranteeType[] = ["MORTGAGE", "PLEDGE", "PERSONAL", "MIXED"];

@Controller("operations")
export class OperationsController {
  constructor(@Inject(CAPTURE_DEPS) private readonly deps: CaptureDeps) {}

  @Get()
  async list(@CurrentActor() actor: Actor) {
    return { items: await listCaseFiles(this.deps, actor) };
  }

  /** Vista previa del checklist dinámico antes de abrir la solicitud. */
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

  /** Fase 2: apertura de la solicitud en borrador sobre una persona existente. */
  @Post()
  @HttpCode(201)
  open(@CurrentActor() actor: Actor, @Body() body: unknown) {
    return openDraftOperation(this.deps, actor, body);
  }

  /** Fase 3: expediente completo con su estado de armado. */
  @Get(":id")
  caseFile(@CurrentActor() actor: Actor, @Param("id") id: string) {
    return getCaseFile(this.deps, actor, id);
  }

  @Get(":id/history")
  async history(@CurrentActor() actor: Actor, @Param("id") id: string) {
    return { items: await getOperationHistory(this.deps, actor, id) };
  }

  @Patch(":id/checklist")
  updateChecklist(@CurrentActor() actor: Actor, @Param("id") id: string, @Body() body: unknown) {
    return updateChecklistItem(this.deps, actor, id, body);
  }

  @Put(":id/assessment")
  assessment(@CurrentActor() actor: Actor, @Param("id") id: string, @Body() body: unknown) {
    return recordFinancialAssessment(this.deps, actor, id, body);
  }

  @Put(":id/guarantor")
  guarantor(@CurrentActor() actor: Actor, @Param("id") id: string, @Body() body: unknown) {
    return setGuarantor(this.deps, actor, id, body);
  }

  @Post(":id/watchlist")
  @HttpCode(201)
  watchlist(@CurrentActor() actor: Actor, @Param("id") id: string, @Body() body: unknown) {
    return recordWatchlistCheck(this.deps, actor, id, body);
  }

  /** Constancia de quién armó el expediente. */
  @Post(":id/assemble")
  @HttpCode(200)
  assemble(@CurrentActor() actor: Actor, @Param("id") id: string) {
    return markCaseAssembled(this.deps, actor, id);
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
