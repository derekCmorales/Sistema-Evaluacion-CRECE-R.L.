import { Controller, Get } from "@nestjs/common";

@Controller("operations")
export class OperationsController {
  @Get()
  listStub() {
    return {
      message: "Módulo operations — scaffold greenfield (sin persistencia aún).",
      items: [],
    };
  }
}
