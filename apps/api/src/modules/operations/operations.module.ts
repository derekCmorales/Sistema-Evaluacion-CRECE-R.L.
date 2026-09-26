import { Module } from "@nestjs/common";
import { OperationsController } from "./operations.controller";
import { InMemoryOperationStore } from "./in-memory-operation.store";
import { UpdateChecklistService } from "./services/update-checklist.service";
import { FinancialAssessmentService } from "./services/financial-assessment.service";
import { GuarantorService } from "./services/guarantor.service";
import { WatchlistService } from "./services/watchlist.service";
import { CaseAssemblyStatusService } from "./services/case-assembly-status.service";

/** Bounded context: operaciones de crédito/captación, checklist y evaluación. */
@Module({
  controllers: [OperationsController],
  providers: [
    InMemoryOperationStore,
    UpdateChecklistService,
    FinancialAssessmentService,
    GuarantorService,
    WatchlistService,
    CaseAssemblyStatusService,
  ],
  exports: [InMemoryOperationStore],
})
export class OperationsModule {}
