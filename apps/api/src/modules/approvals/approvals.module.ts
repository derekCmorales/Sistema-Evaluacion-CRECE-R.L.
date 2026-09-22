import { Module } from "@nestjs/common";
import { ApprovalsController } from "./approvals.controller";

/** Bounded context: autorización (Jefatura+Delegado o Consejo) y bitácora. */
@Module({
  controllers: [ApprovalsController],
})
export class ApprovalsModule {}
