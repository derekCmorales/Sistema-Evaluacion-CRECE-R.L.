import { Module } from "@nestjs/common";
import { MemoryModule } from "../memory/memory.module";
import { PersonsController } from "./persons.controller";

@Module({
  imports: [MemoryModule],
  controllers: [PersonsController],
})
export class PersonsModule {}
