import { Module } from "@nestjs/common";
import { ProspectsController } from "./prospects.controller";

/** Bounded context: personas/prospectos (origen landing o interno). */
@Module({
  controllers: [ProspectsController],
})
export class ProspectsModule {}
