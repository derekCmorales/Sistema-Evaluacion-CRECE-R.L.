import { Module } from "@nestjs/common";
import { MemoryModule } from "../memory/memory.module";
import { AuditController } from "./audit.controller";

@Module({
  imports: [MemoryModule],
  controllers: [AuditController],
})
export class AuditModule {}
