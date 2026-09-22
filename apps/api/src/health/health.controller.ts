import { Controller, Get } from "@nestjs/common";
import { API_HEALTH_PATH } from "@crece/shared";

@Controller()
export class HealthController {
  @Get(API_HEALTH_PATH.slice(1))
  health() {
    return {
      status: "ok",
      service: "crece-api",
      timestamp: new Date().toISOString(),
    };
  }
}
