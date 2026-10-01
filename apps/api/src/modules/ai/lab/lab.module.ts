import { Module, type DynamicModule } from "@nestjs/common";
import type { LabContext } from "./lab-context";
import { LabController } from "./lab.controller";
import { LabGuard } from "./lab.guard";
import { LabMaintenance } from "./lab-maintenance";
import { LAB_CONTEXT } from "./lab.tokens";

/**
 * Laboratorio interno de IA (solo fuera de producción). Depende del motor (`AiModule`, global);
 * el motor y el resto de la API no dependen de él: si se quita este módulo, nada más cambia.
 */
@Module({})
export class LabModule {
  static register(lab: LabContext): DynamicModule {
    return {
      module: LabModule,
      controllers: [LabController],
      providers: [{ provide: LAB_CONTEXT, useValue: lab }, LabGuard, LabMaintenance],
    };
  }
}
