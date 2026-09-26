import { Module } from "@nestjs/common";
import { OperationsController } from "./operations.controller";
import { InMemoryOperationStore } from "./in-memory-operation.store";

/** Bounded context: operaciones de crédito/captación, checklist y evaluación. */
@Module({
  controllers: [OperationsController],
  providers: [InMemoryOperationStore],
  exports: [InMemoryOperationStore],
})
export class OperationsModule {}
