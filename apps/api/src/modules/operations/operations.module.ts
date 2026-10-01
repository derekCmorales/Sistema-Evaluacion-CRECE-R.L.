import { Module } from "@nestjs/common";
import { MemoryModule } from "../memory/memory.module";
import { OperationsController } from "./operations.controller";
import { UpdateChecklistService } from "./services/update-checklist.service";
import { FinancialAssessmentService } from "./services/financial-assessment.service";
import { GuarantorService } from "./services/guarantor.service";
import { WatchlistService } from "./services/watchlist.service";
import { CaseAssemblyStatusService } from "./services/case-assembly-status.service";

@Module({
  imports: [MemoryModule],
  controllers: [OperationsController],
  providers: [
    UpdateChecklistService,
    FinancialAssessmentService,
    GuarantorService,
    WatchlistService,
    CaseAssemblyStatusService,
  ],
})
export class OperationsModule {}
