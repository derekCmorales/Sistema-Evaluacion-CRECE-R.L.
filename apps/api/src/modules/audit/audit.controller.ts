import { Controller, Get, Headers } from "@nestjs/common";
import { readAudit } from "@crece/application";
import { InMemoryPersonStore } from "../persons/in-memory-person.store";
import { InMemoryOperationStore } from "../operations/in-memory-operation.store";
import { InMemoryAuditLog } from "../memory/in-memory-audit-log";
import { intakeDeps } from "../memory/intake-deps";
import { actorFromHeaders } from "../../common/actor";

@Controller("audit-log")
export class AuditController {
  constructor(
    private readonly persons: InMemoryPersonStore,
    private readonly operations: InMemoryOperationStore,
    private readonly audit: InMemoryAuditLog,
  ) {}

  @Get()
  list(@Headers() headers: Record<string, string | string[] | undefined>) {
    const deps = intakeDeps(this.persons, this.operations, this.audit);
    return {
      items: readAudit(
        { ...deps, auditEntries: () => this.audit.list() },
        actorFromHeaders(headers),
      ),
    };
  }
}
