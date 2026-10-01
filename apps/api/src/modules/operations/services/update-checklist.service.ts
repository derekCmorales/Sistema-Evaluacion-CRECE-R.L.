import { Injectable } from "@nestjs/common";
import { updateOperationChecklist, type IntakeActor } from "@crece/application";
import { InMemoryOperationStore } from "../in-memory-operation.store";
import { InMemoryPersonStore } from "../../persons/in-memory-person.store";
import { InMemoryAuditLog } from "../../memory/in-memory-audit-log";
import { intakeDeps } from "../../memory/intake-deps";
import { SERVICE_TEST_ACTOR } from "../../../common/actor";

@Injectable()
export class UpdateChecklistService {
  constructor(
    private readonly operations: InMemoryOperationStore,
    private readonly persons: InMemoryPersonStore = new InMemoryPersonStore(),
    private readonly audit: InMemoryAuditLog = new InMemoryAuditLog(),
  ) {}

  execute(
    operationId: string,
    rawBody: Record<string, unknown>,
    actor: IntakeActor = SERVICE_TEST_ACTOR,
  ) {
    const updated = updateOperationChecklist(
      intakeDeps(this.persons, this.operations, this.audit),
      operationId,
      rawBody,
      actor,
    );
    return {
      operationId: updated.id,
      checklist: updated.checklist,
      updatedAt: updated.updatedAt,
    };
  }
}
