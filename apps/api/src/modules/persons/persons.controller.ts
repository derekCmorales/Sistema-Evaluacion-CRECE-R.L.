import { Body, Controller, Get, Headers, Param, Post } from "@nestjs/common";
import {
  assertPermission,
  getPerson,
  listPersons,
  registerPerson,
} from "@crece/application";
import { maskDpi, NotFoundError } from "@crece/shared";
import { normalizeDpi } from "@crece/application";
import { InMemoryPersonStore } from "./in-memory-person.store";
import { InMemoryOperationStore } from "../operations/in-memory-operation.store";
import { InMemoryAuditLog } from "../memory/in-memory-audit-log";
import { intakeDeps } from "../memory/intake-deps";
import { actorFromHeaders } from "../../common/actor";

@Controller("persons")
export class PersonsController {
  constructor(
    private readonly persons: InMemoryPersonStore,
    private readonly operations: InMemoryOperationStore,
    private readonly audit: InMemoryAuditLog,
  ) {}

  @Get()
  list(@Headers() headers: Record<string, string | string[] | undefined>) {
    return {
      persistence: "in-memory",
      items: listPersons(this.deps(), actorFromHeaders(headers)),
    };
  }

  /** El DPI viaja en el cuerpo, no en la URL. */
  @Post("lookup")
  lookup(
    @Body() body: { dpi?: string },
    @Headers() headers: Record<string, string | string[] | undefined>,
  ) {
    const actor = actorFromHeaders(headers);
    assertPermission(actor.offices, "person:read");
    const dpi = normalizeDpi(body?.dpi);
    const person = this.persons.getByDpi(dpi);
    if (!person) {
      throw new NotFoundError("No existe una persona con ese DPI");
    }
    return {
      ...person,
      operationsCount: this.operations.getByPersonId(person.id).length,
    };
  }

  @Get(":id")
  getOne(
    @Param("id") id: string,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ) {
    return getPerson(this.deps(), id, actorFromHeaders(headers));
  }

  @Get(":id/operations")
  getPersonOperations(
    @Param("id") id: string,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ) {
    const detail = getPerson(this.deps(), id, actorFromHeaders(headers));
    return {
      personId: detail.id,
      fullName: detail.fullName,
      dpi: detail.dpi ? maskDpi(detail.dpi) : "",
      operations: detail.operations,
      count: detail.operations.length,
    };
  }

  @Post()
  create(
    @Body() body: unknown,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ) {
    const stored = registerPerson(this.deps(), body, actorFromHeaders(headers));
    return {
      personId: stored.id,
      fullName: stored.fullName,
      dpi: stored.dpi,
      status: stored.status,
      source: stored.source,
      interest: stored.interest,
      registeredByUserId: stored.registeredByUserId,
      createdAt: stored.createdAt,
    };
  }

  private deps() {
    return intakeDeps(this.persons, this.operations, this.audit);
  }
}
