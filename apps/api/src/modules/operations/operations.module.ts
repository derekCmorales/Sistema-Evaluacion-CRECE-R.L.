import { Module } from "@nestjs/common";
import { OperationsController } from "./operations.controller";

/** Bounded context: operaciones de crédito/captación, checklist y evaluación. */
@Module({
  controllers: [OperationsController],
})
export class OperationsModule {}
