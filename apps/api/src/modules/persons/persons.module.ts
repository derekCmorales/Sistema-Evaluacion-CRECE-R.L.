import { Module } from "@nestjs/common";
import { PersonsController } from "./persons.controller";
import { InMemoryPersonStore } from "./in-memory-person.store";
import { OperationsModule } from "../operations/operations.module";

@Module({
  imports: [OperationsModule],
  controllers: [PersonsController],
  providers: [InMemoryPersonStore],
  exports: [InMemoryPersonStore],
})
export class PersonsModule {}
