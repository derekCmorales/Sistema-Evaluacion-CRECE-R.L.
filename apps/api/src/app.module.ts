import { Module, type DynamicModule } from "@nestjs/common";
import { HealthModule } from "./health/health.module";
import { ProspectsModule } from "./modules/prospects/prospects.module";
import { OperationsModule } from "./modules/operations/operations.module";
import { ApprovalsModule } from "./modules/approvals/approvals.module";
import { CatalogModule } from "./modules/catalog/catalog.module";
import { AiModule } from "./modules/ai/ai.module";
import { createLabContext } from "./modules/ai/lab/lab-context";
import { LabModule } from "./modules/ai/lab/lab.module";
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
  /**
   * Composition root de la API. El motor de IA entra como módulo aparte (apagado, el resto de la
   * API no cambia). El laboratorio solo se registra fuera de producción y con su flag, y es lo
   * único que conoce su almacenamiento; su guard lo vuelve a verificar en cada solicitud.
   */
  static forRoot(aiEnv: AiEnv): DynamicModule {
    const lab = createLabContext(aiEnv);
    return {
      module: AppModule,
      imports: [
        AiModule.register(aiEnv, { role: "api", documentRoutes: lab ? [lab.documentRoute] : [] }),
        ...(lab ? [LabModule.register(lab)] : []),
      ],
    };
  }
}
