import { Injectable } from "@nestjs/common";
import { caseAssemblyStatus, type IntakeActor } from "@crece/application";
import { InMemoryOperationStore } from "../in-memory-operation.store";
import { InMemoryPersonStore } from "../../persons/in-memory-person.store";
import { InMemoryAuditLog } from "../../memory/in-memory-audit-log";
import { WatchlistPolicy } from "../../memory/watchlist-policy";
import { intakeDeps } from "../../memory/intake-deps";
import { SERVICE_TEST_ACTOR } from "../../../common/actor";

@Injectable()
export class CaseAssemblyStatusService {
  constructor(
    private readonly operations: InMemoryOperationStore,
    private readonly persons: InMemoryPersonStore = new InMemoryPersonStore(),
    private readonly audit: InMemoryAuditLog = new InMemoryAuditLog(),
    private readonly policy: WatchlistPolicy = new WatchlistPolicy(),
  ) {}

  evaluate(operationId: string, actor: IntakeActor = SERVICE_TEST_ACTOR) {
    return caseAssemblyStatus(
      intakeDeps(this.persons, this.operations, this.audit, this.policy.requiredSources),
      operationId,
      actor,
    );
  }
}
