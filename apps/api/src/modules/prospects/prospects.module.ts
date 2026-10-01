import { Module } from "@nestjs/common";
import { MemoryModule } from "../memory/memory.module";
import { ProspectsController } from "./prospects.controller";

@Module({
  imports: [MemoryModule],
  controllers: [ProspectsController],
})
export class ProspectsModule {}
