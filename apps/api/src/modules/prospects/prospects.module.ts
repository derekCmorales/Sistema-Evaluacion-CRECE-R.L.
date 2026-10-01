import { Module } from "@nestjs/common";
import { ProspectsController } from "./prospects.controller";

@Module({
  controllers: [ProspectsController],
})
export class ProspectsModule {}
