import { Module } from "@nestjs/common";
import { HealthModule } from "./health/health.module";
import { ProspectsModule } from "./modules/prospects/prospects.module";
import { PersonsModule } from "./modules/persons/persons.module";
import { OperationsModule } from "./modules/operations/operations.module";
import { ApprovalsModule } from "./modules/approvals/approvals.module";
import { CatalogModule } from "./modules/catalog/catalog.module";

@Module({
  imports: [
    HealthModule,
    CatalogModule,
    ProspectsModule,
    PersonsModule,
    OperationsModule,
    ApprovalsModule,
  ],
})
export class AppModule {}
