import { Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { parseWatchlistCheckInput } from "@crece/application";
import { InMemoryOperationStore } from "../in-memory-operation.store";

@Injectable()
export class WatchlistService {
  constructor(private readonly store: InMemoryOperationStore) {}

  execute(operationId: string, rawBody: Record<string, unknown>) {
    const parsed = parseWatchlistCheckInput({
      ...rawBody,
      operationId,
    });

    const watchlistEntry = {
      id: randomUUID(),
      operationId: parsed.operationId,
      source: parsed.source,
      queryRef: parsed.queryRef,
      result: parsed.result,
      checkedByUserId: parsed.checkedByUserId,
      checkedAt: new Date().toISOString(),
      notes: parsed.notes,
    };

    const updatedOperation = this.store.addWatchlistCheck(operationId, watchlistEntry);

    if (!updatedOperation) {
      throw new NotFoundException(`Operación con id ${operationId} no encontrada`);
    }

    return {
      operationId: updatedOperation.id,
      watchlistChecks: updatedOperation.watchlistChecks,
    };
  }
}
