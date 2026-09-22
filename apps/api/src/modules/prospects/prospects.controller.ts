import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { parsePublicProspect, toProspectPerson } from "@crece/application";
import { InMemoryProspectStore } from "./in-memory-prospect.store";

@Controller()
export class ProspectsController {
  constructor(private readonly store: InMemoryProspectStore) {}

  @Get("prospects")
  list() {
    return {
      persistence: "in-memory",
      items: this.store.list(),
    };
  }

  /**
   * Contrato landing → sistema. Crea solo Person (PROSPECT), nunca Operation.
   */
  @Post("public/prospects")
  @HttpCode(201)
  createFromLanding(@Body() body: unknown) {
    const parsed = parsePublicProspect({ ...asObject(body), source: "LANDING" });
    const person = toProspectPerson(parsed, randomUUID());
    const stored = this.store.add({
      ...person,
      interest: parsed.interest,
      amountHint: parsed.amountHint,
      message: parsed.message,
      source: parsed.source,
    });
    return {
      prospectId: stored.id,
      status: stored.status,
      interest: stored.interest,
    };
  }
}

function asObject(body: unknown): Record<string, unknown> {
  return typeof body === "object" && body !== null
    ? (body as Record<string, unknown>)
    : {};
}
