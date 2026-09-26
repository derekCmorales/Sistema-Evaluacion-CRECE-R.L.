import { Module } from "@nestjs/common";
import { PersonsController } from "./persons.controller";
import { InMemoryPersonStore } from "./in-memory-person.store";

@Module({
  controllers: [PersonsController],
  providers: [InMemoryPersonStore],
  exports: [InMemoryPersonStore],
})
export class PersonsModule {}
