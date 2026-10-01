import { Body, Controller, HttpCode, Inject, Post } from "@nestjs/common";
import { registerLandingProspect, type CaptureDeps } from "@crece/application";
import { CAPTURE_DEPS } from "../capture/capture.tokens";

@Controller()
export class ProspectsController {
  constructor(@Inject(CAPTURE_DEPS) private readonly deps: CaptureDeps) {}

  /**
   * Contrato landing → sistema (único puente con el otro repo). Crea solo Person PROSPECT,
   * nunca Operation, en el mismo repositorio que usa la agencia.
   */
  @Post("public/prospects")
  @HttpCode(201)
  async createFromLanding(@Body() body: unknown) {
    const person = await registerLandingProspect(this.deps, body);
    return { prospectId: person.id, status: person.status, interest: person.interest };
  }
}
