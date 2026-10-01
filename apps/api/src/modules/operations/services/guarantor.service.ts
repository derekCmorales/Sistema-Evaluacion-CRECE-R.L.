import { Injectable } from "@nestjs/common";
import { addGuarantor, type IntakeActor } from "@crece/application";
import { InMemoryOperationStore } from "../in-memory-operation.store";
import { InMemoryPersonStore } from "../../persons/in-memory-person.store";
import { InMemoryAuditLog } from "../../memory/in-memory-audit-log";
import { intakeDeps } from "../../memory/intake-deps";
import { SERVICE_TEST_ACTOR } from "../../../common/actor";

@Injectable()
export class GuarantorService {
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
    const updated = addGuarantor(
      intakeDeps(this.persons, this.operations, this.audit),
      operationId,
      rawBody,
      actor,
    );
    return {
      operationId: updated.id,
      guarantor: updated.guarantor,
      guarantorAssessment: updated.guarantorAssessment,
      checklist: updated.checklist,
      updatedAt: updated.updatedAt,
    };
  }
}
