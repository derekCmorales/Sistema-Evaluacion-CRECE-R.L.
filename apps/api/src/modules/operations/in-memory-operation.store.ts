import { Injectable } from "@nestjs/common";
import {
  MOCK_DRAFT_OPERATION_NO_GUARANTOR,
  MOCK_DRAFT_OPERATION_WITH_GUARANTOR,
  MOCK_WATCHLIST_CHECKS,
  type Operation,
} from "@crece/domain";
import type {
  ChecklistItemStatus,
  DocumentId,
  UpdateFinancialAssessmentInput,
  UpdateGuarantorInput,
  UserId,
  WatchlistCheckSummaryDto,
} from "@crece/shared";

@Injectable()
export class InMemoryOperationStore {
  private readonly operations = new Map<string, Operation>();

  constructor() {
    // Inicializar con fixtures para permitir trabajo simultáneo de Fase 3
    const op1: Operation = {
      ...MOCK_DRAFT_OPERATION_NO_GUARANTOR,
      watchlistChecks: [...MOCK_WATCHLIST_CHECKS],
    };
    const op2: Operation = {
      ...MOCK_DRAFT_OPERATION_WITH_GUARANTOR,
      watchlistChecks: [],
    };

    this.operations.set(op1.id, op1);
    this.operations.set(op2.id, op2);
  }

  list(): Operation[] {
    return [...this.operations.values()];
  }

  get(id: string): Operation | undefined {
    return this.operations.get(id);
  }

  add(operation: Operation): Operation {
    this.operations.set(operation.id, operation);
    return operation;
  }

  updateChecklistItem(
    operationId: string,
    code: string,
    status: ChecklistItemStatus,
    notApplicableReason?: string,
    documentId?: DocumentId,
  ): Operation | undefined {
    const op = this.operations.get(operationId);
    if (!op) return undefined;

    const updatedChecklist = op.checklist.map((item) => {
      if (item.code === code) {
        return {
          ...item,
          status,
          notApplicableReason: status === "NOT_APPLICABLE" ? notApplicableReason : undefined,
          documentId: documentId ?? item.documentId,
        };
      }
      return item;
    });

    const updatedOp: Operation = {
      ...op,
      checklist: updatedChecklist,
      updatedAt: new Date().toISOString(),
    };

    this.operations.set(operationId, updatedOp);
    return updatedOp;
  }

  updateAssessment(
    operationId: string,
    assessment: UpdateFinancialAssessmentInput,
  ): Operation | undefined {
    const op = this.operations.get(operationId);
    if (!op) return undefined;

    const updatedOp: Operation = {
      ...op,
      assessment: {
        monthlySales: assessment.monthlySales,
        monthlyIncome: assessment.monthlyIncome,
        monthlyExpenses: assessment.monthlyExpenses,
        existingDebtPayment: assessment.existingDebtPayment,
        guaranteeValue: assessment.guaranteeValue,
        projectedRoiPercent: assessment.projectedRoiPercent,
      },
      updatedAt: new Date().toISOString(),
    };

    this.operations.set(operationId, updatedOp);
    return updatedOp;
  }

  updateGuarantor(
    operationId: string,
    guarantor: UpdateGuarantorInput,
  ): Operation | undefined {
    const op = this.operations.get(operationId);
    if (!op) return undefined;

    const updatedOp: Operation = {
      ...op,
      hasGuarantor: true,
      guarantor: {
        fullName: guarantor.fullName,
        dpi: guarantor.dpi,
        phone: guarantor.phone,
        relationship: guarantor.relationship,
      },
      guarantorAssessment: guarantor.financialAssessment
        ? {
            monthlyIncome: guarantor.financialAssessment.monthlyIncome,
            monthlyExpenses: guarantor.financialAssessment.monthlyExpenses,
            existingDebtPayment: guarantor.financialAssessment.existingDebtPayment,
            guaranteeValue: guarantor.financialAssessment.guaranteeValue,
          }
        : op.guarantorAssessment,
      updatedAt: new Date().toISOString(),
    };

    this.operations.set(operationId, updatedOp);
    return updatedOp;
  }

  addWatchlistCheck(
    operationId: string,
    check: WatchlistCheckSummaryDto,
  ): Operation | undefined {
    const op = this.operations.get(operationId);
    if (!op) return undefined;

    const existing = op.watchlistChecks ?? [];
    const updatedOp: Operation = {
      ...op,
      watchlistChecks: [...existing, check],
      updatedAt: new Date().toISOString(),
    };

    this.operations.set(operationId, updatedOp);
    return updatedOp;
  }

  setAssembledBy(operationId: string, userId: UserId): Operation | undefined {
    const op = this.operations.get(operationId);
    if (!op) return undefined;

    const updatedOp: Operation = {
      ...op,
      assembledByUserId: userId,
      assembledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.operations.set(operationId, updatedOp);
    return updatedOp;
  }
}
