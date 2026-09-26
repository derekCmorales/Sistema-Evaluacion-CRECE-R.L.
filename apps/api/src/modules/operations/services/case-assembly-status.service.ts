import { Injectable, NotFoundException } from "@nestjs/common";
import { isChecklistReadyForReview } from "@crece/domain";
import type { CaseAssemblyStatusDto, WatchlistSource } from "@crece/shared";
import { InMemoryOperationStore } from "../in-memory-operation.store";

const REQUIRED_WATCHLIST_SOURCES: WatchlistSource[] = ["OFAC", "ONU", "GUATECOMPRAS"];

@Injectable()
export class CaseAssemblyStatusService {
  constructor(private readonly store: InMemoryOperationStore) {}

  evaluate(operationId: string): CaseAssemblyStatusDto {
    const operation = this.store.get(operationId);

    if (!operation) {
      throw new NotFoundException(`Operación con id ${operationId} no encontrada`);
    }

    const checklistComplete = isChecklistReadyForReview(operation.checklist);

    const pendingChecklistCount = operation.checklist.filter(
      (item) => item.required && item.status === "PENDING",
    ).length;

    const hasFinancialAssessment = operation.assessment !== undefined;

    const completedSources = new Set(
      (operation.watchlistChecks ?? []).map((check) => check.source),
    );
    const watchlistChecksCompleted = REQUIRED_WATCHLIST_SOURCES.every((source) =>
      completedSources.has(source),
    );

    const readyForReview =
      checklistComplete &&
      hasFinancialAssessment &&
      watchlistChecksCompleted;

    return {
      operationId: operation.id,
      assembledByUserId: operation.assembledByUserId,
      assembledAt: operation.assembledAt,
      checklistComplete,
      pendingChecklistCount,
      hasFinancialAssessment,
      watchlistChecksCompleted,
      readyForReview,
    };
  }
}
