import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import {
  DEFAULT_RATES_CONFIG,
  ValidationError,
  money,
  toUserId,
  type GuaranteeType,
  type ProductType,
} from "@crece/shared";
import {
  calculateCreditMetrics,
  createChecklistItems,
  evaluateHardRules,
} from "@crece/domain";
import {
  parseCreateDraftOperation,
  parseFinancialAssessmentInput,
  parseGuarantorInput,
  parseUpdateChecklistItem,
  parseWatchlistCheckInput,
  toDraftOperationEntity,
} from "@crece/application";
import { InMemoryOperationStore } from "./in-memory-operation.store";

const PRODUCTS: ProductType[] = [
  "WORKING_CAPITAL",
  "INVESTMENT",
  "MICROCREDIT",
];
const GUARANTEES: GuaranteeType[] = ["MORTGAGE", "PLEDGE", "PERSONAL", "MIXED"];

@Controller("operations")
export class OperationsController {
  constructor(private readonly store: InMemoryOperationStore) {}

  @Get()
  list() {
    return {
      persistence: "in-memory-contracts",
      items: this.store.list(),
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

  @Get(":id")
  getOne(@Param("id") id: string) {
    const op = this.store.get(id);
    if (!op) {
      throw new NotFoundException(`Operación con id ${id} no encontrada`);
    }
    return op;
  }

  /**
   * Fase 2: Apertura de solicitud en borrador (DRAFT)
   */
  @Post()
  createDraft(@Body() body: unknown) {
    const parsed = parseCreateDraftOperation(body);
    const operation = toDraftOperationEntity(parsed, randomUUID());
    const stored = this.store.add(operation);
    return {
      operationId: stored.id,
      personId: stored.personId,
      state: stored.state,
      checklist: stored.checklist,
      createdAt: stored.createdAt,
    };
  }

  /**
   * Fase 3: Actualización de casillas del checklist (carga o N/A justificado)
   */
  @Patch(":id/checklist")
  updateChecklist(@Param("id") id: string, @Body() body: unknown) {
    const payload = asObject(body);
    const parsed = parseUpdateChecklistItem({
      ...payload,
      operationId: id,
    });
    const updated = this.store.updateChecklistItem(
      id,
      parsed.code,
      parsed.status,
      parsed.notApplicableReason,
      parsed.documentId,
    );
    if (!updated) {
      throw new NotFoundException(`Operación con id ${id} no encontrada`);
    }
    return {
      operationId: updated.id,
      checklist: updated.checklist,
      updatedAt: updated.updatedAt,
    };
  }

  /**
   * Fase 3: Captura manual de evaluación financiera
   */
  @Post(":id/assessment")
  updateAssessment(@Param("id") id: string, @Body() body: unknown) {
    const payload = asObject(body);
    const parsed = parseFinancialAssessmentInput({
      ...payload,
      operationId: id,
    });
    const updated = this.store.updateAssessment(id, parsed);
    if (!updated) {
      throw new NotFoundException(`Operación con id ${id} no encontrada`);
    }
    return {
      operationId: updated.id,
      assessment: updated.assessment,
      updatedAt: updated.updatedAt,
    };
  }

  /**
   * Fase 3: Registro de fiador opcional
   */
  @Post(":id/guarantor")
  updateGuarantor(@Param("id") id: string, @Body() body: unknown) {
    const payload = asObject(body);
    const parsed = parseGuarantorInput({
      ...payload,
      operationId: id,
    });
    const updated = this.store.updateGuarantor(id, parsed);
    if (!updated) {
      throw new NotFoundException(`Operación con id ${id} no encontrada`);
    }
    return {
      operationId: updated.id,
      guarantor: updated.guarantor,
      guarantorAssessment: updated.guarantorAssessment,
      updatedAt: updated.updatedAt,
    };
  }

  /**
   * Fase 3: Registro de consulta a listas de control (OFAC, ONU, Guatecompras)
   */
  @Post(":id/watchlist")
  recordWatchlistCheck(@Param("id") id: string, @Body() body: unknown) {
    const payload = asObject(body);
    const parsed = parseWatchlistCheckInput({
      ...payload,
      operationId: id,
    });
    const checkEntry = {
      id: randomUUID(),
      operationId: parsed.operationId,
      source: parsed.source,
      queryRef: parsed.queryRef,
      result: parsed.result,
      checkedByUserId: parsed.checkedByUserId,
      checkedAt: new Date().toISOString(),
      notes: parsed.notes,
    };
    const updated = this.store.addWatchlistCheck(id, checkEntry);
    if (!updated) {
      throw new NotFoundException(`Operación con id ${id} no encontrada`);
    }
    return {
      operationId: updated.id,
      watchlistChecks: updated.watchlistChecks,
    };
  }

  /**
   * Fase 3: Trazabilidad de quién armó el caso
   */
  @Post(":id/assemble")
  setAssembledBy(@Param("id") id: string, @Body() body: { assembledByUserId: string }) {
    if (!body?.assembledByUserId?.trim()) {
      throw new ValidationError("assembledByUserId es obligatorio");
    }
    const updated = this.store.setAssembledBy(id, toUserId(body.assembledByUserId.trim()));
    if (!updated) {
      throw new NotFoundException(`Operación con id ${id} no encontrada`);
    }
    return {
      operationId: updated.id,
      assembledByUserId: updated.assembledByUserId,
      assembledAt: updated.assembledAt,
    };
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

function asObject(body: unknown): Record<string, unknown> {
  return typeof body === "object" && body !== null
    ? (body as Record<string, unknown>)
    : {};
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
