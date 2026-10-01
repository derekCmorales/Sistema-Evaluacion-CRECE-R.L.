import { Body, Controller, Get, HttpCode, Inject, Param, Post, Put, Query } from "@nestjs/common";
import {
  assignPersonDpi,
  findPersonByDpi,
  getPersonProfile,
  listPersons,
  registerPerson,
  type CaptureDeps,
} from "@crece/application";
import type { Actor, PersonSource } from "@crece/shared";
import { CurrentActor } from "../../common/current-actor";
import { CAPTURE_DEPS } from "../capture/capture.tokens";

/** Fase 1 — registro del solicitante. El DPI nunca viaja en la URL. */
@Controller("persons")
export class PersonsController {
  constructor(@Inject(CAPTURE_DEPS) private readonly deps: CaptureDeps) {}

  @Get()
  async list(@CurrentActor() actor: Actor, @Query("source") source?: string) {
    const filter = source === "LANDING" || source === "ADVISOR" ? { source: source as PersonSource } : {};
    return { items: await listPersons(this.deps, actor, filter) };
  }

  /** Búsqueda previa al registro para no duplicar identidades. */
  @Post("lookup")
  @HttpCode(200)
  async lookup(@CurrentActor() actor: Actor, @Body() body: unknown) {
    return { match: await findPersonByDpi(this.deps, actor, body) };
  }

  @Get(":id")
  profile(@CurrentActor() actor: Actor, @Param("id") id: string) {
    return getPersonProfile(this.deps, actor, id);
  }

  @Post()
  @HttpCode(201)
  register(@CurrentActor() actor: Actor, @Body() body: unknown) {
    return registerPerson(this.deps, actor, body);
  }

  /** Completa el DPI de un prospecto que llegó por la landing. */
  @Put(":id/dpi")
  assignDpi(@CurrentActor() actor: Actor, @Param("id") id: string, @Body() body: unknown) {
    return assignPersonDpi(this.deps, actor, id, body);
  }
}
