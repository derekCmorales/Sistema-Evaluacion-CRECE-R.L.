import { Controller, Get } from "@nestjs/common";

@Controller("approvals")
export class ApprovalsController {
  @Get("policy")
  policyStub() {
    return {
      message:
        "Política configurable — ver docs/autorizacion.md y domain/policies/authorization-policy.ts",
      defaultThresholdGtq: 100_000,
    };
  }
}
