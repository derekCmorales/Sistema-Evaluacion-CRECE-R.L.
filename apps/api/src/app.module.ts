import { Module } from "@nestjs/common";
import { HealthModule } from "./health/health.module";
import { ProspectsModule } from "./modules/prospects/prospects.module";
import { PersonsModule } from "./modules/persons/persons.module";
import { OperationsModule } from "./modules/operations/operations.module";
import { ApprovalsModule } from "./modules/approvals/approvals.module";
import { CatalogModule } from "./modules/catalog/catalog.module";
import { AuditModule } from "./modules/audit/audit.module";

@Module({
  imports: [
    HealthModule,
    CatalogModule,
    ProspectsModule,
    PersonsModule,
    OperationsModule,
    ApprovalsModule,
    AuditModule,
  ],
})
export class AppModule {}
