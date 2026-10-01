import { Body, Controller, Get, Headers, HttpCode, Post } from "@nestjs/common";
import { assertPermission, capturePublicProspect } from "@crece/application";
import { InMemoryPersonStore } from "../persons/in-memory-person.store";
import { InMemoryOperationStore } from "../operations/in-memory-operation.store";
import { InMemoryAuditLog } from "../memory/in-memory-audit-log";
import { intakeDeps } from "../memory/intake-deps";
import { actorFromHeaders } from "../../common/actor";

@Controller()
export class ProspectsController {
  constructor(
    private readonly persons: InMemoryPersonStore,
    private readonly operations: InMemoryOperationStore,
    private readonly audit: InMemoryAuditLog,
  ) {}

  @Get("prospects")
  list(@Headers() headers: Record<string, string | string[] | undefined>) {
    assertPermission(actorFromHeaders(headers).offices, "prospect:read");
    return {
      persistence: "in-memory",
      items: this.persons.list().filter((person) => person.status === "PROSPECT"),
    };
  }

  /**
   * Landing y agencia escriben en el mismo repositorio de personas.
   * Crea solo Person (PROSPECT), nunca Operation.
   */
  @Post("public/prospects")
  @HttpCode(201)
  createFromLanding(@Body() body: unknown) {
    const person = capturePublicProspect(this.deps(), {
      ...(typeof body === "object" && body !== null ? body : {}),
      source: "LANDING",
    });
    return {
      prospectId: person.id,
      status: person.status,
      interest: person.interest,
    };
  }

  private deps() {
    return intakeDeps(this.persons, this.operations, this.audit);
  }
}
