import { Inject, Injectable, NotFoundException, type CanActivate } from "@nestjs/common";
import type { AiEnv } from "../../infrastructure/ai/ai-env";
import { AI_ENV } from "./ai.tokens";

/**
 * El laboratorio no existe en producción ni con el flag apagado: responde 404 (spec ai-lab),
 * aunque el controller llegara a registrarse por error. Cuando exista autenticación, además
 * se exigirá SYSTEM_ADMIN.
 */
@Injectable()
export class LabGuard implements CanActivate {
  constructor(@Inject(AI_ENV) private readonly env: AiEnv) {}

  canActivate(): boolean {
    if (this.env.isProduction || !this.env.lab.enabled || !this.env.engineEnabled) {
      throw new NotFoundException();
    }
    return true;
  }
}
