import { Injectable, NotFoundException } from "@nestjs/common";
import { parseUpdateChecklistItem } from "@crece/application";
import { InMemoryOperationStore } from "../in-memory-operation.store";

@Injectable()
export class UpdateChecklistService {
  constructor(private readonly store: InMemoryOperationStore) {}

  execute(operationId: string, rawBody: Record<string, unknown>) {
    const parsed = parseUpdateChecklistItem({
      ...rawBody,
      operationId,
    });

    const updatedOperation = this.store.updateChecklistItem(
      operationId,
      parsed.code,
      parsed.status,
      parsed.notApplicableReason,
      parsed.documentId,
    );

    if (!updatedOperation) {
      throw new NotFoundException(`Operación con id ${operationId} no encontrada`);
    }

    return {
      operationId: updatedOperation.id,
      checklist: updatedOperation.checklist,
      updatedAt: updatedOperation.updatedAt,
    };
  }
}
