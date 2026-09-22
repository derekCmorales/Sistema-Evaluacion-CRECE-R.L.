import { Controller, Get } from "@nestjs/common";

@Controller("prospects")
export class ProspectsController {
  @Get()
  listStub() {
    return {
      message: "Módulo prospects — scaffold greenfield (sin persistencia aún).",
      items: [],
    };
  }
}
