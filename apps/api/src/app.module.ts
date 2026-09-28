import { Module, type DynamicModule } from "@nestjs/common";
import { HealthModule } from "./health/health.module";
import { ProspectsModule } from "./modules/prospects/prospects.module";
import { OperationsModule } from "./modules/operations/operations.module";
import { ApprovalsModule } from "./modules/approvals/approvals.module";
import { CatalogModule } from "./modules/catalog/catalog.module";
import { AiModule } from "./modules/ai/ai.module";
import type { AiEnv } from "./infrastructure/ai/ai-env";

@Module({
  imports: [
    HealthModule,
    CatalogModule,
    ProspectsModule,
    OperationsModule,
    ApprovalsModule,
  ],
})
export class AppModule {
  /** El motor de IA entra como módulo aparte; apagado, el resto de la API no cambia. */
  static forRoot(aiEnv: AiEnv): DynamicModule {
    return { module: AppModule, imports: [AiModule.register(aiEnv)] };
  }
}
