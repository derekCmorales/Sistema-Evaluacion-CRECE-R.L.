import { Module } from "@nestjs/common";
import { OperationsController } from "./operations.controller";
import { ReviewController } from "./review.controller";

/** Bounded context: operaciones de crédito/captación, checklist y evaluación. */
@Module({
  controllers: [OperationsController, ReviewController],
})
export class OperationsModule {}
