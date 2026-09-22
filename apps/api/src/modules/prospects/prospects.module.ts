import { Module } from "@nestjs/common";
import { ProspectsController } from "./prospects.controller";
import { InMemoryProspectStore } from "./in-memory-prospect.store";

@Module({
  controllers: [ProspectsController],
  providers: [InMemoryProspectStore],
})
export class ProspectsModule {}
