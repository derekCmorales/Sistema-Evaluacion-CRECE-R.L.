import { Controller, Get } from "@nestjs/common";
import {
  ALL_OFFICES,
  DEFAULT_AUTHORIZATION_POLICY,
  DEFAULT_RATES_CONFIG,
  DEFAULT_SEMAPHORE_CONFIG,
  GUARANTEE_TYPE_LABELS,
  OFFICE_LABELS,
  PRODUCT_TYPE_LABELS,
  VERDICT_DECISION_LABELS,
} from "@crece/shared";
import { DEFAULT_DECISION_FACTORS } from "@crece/domain";
import { PERMISSIONS } from "@crece/application";

@Controller("catalog")
export class CatalogController {
  @Get()
  catalog() {
    return {
      offices: ALL_OFFICES.map((code) => ({
        code,
        label: OFFICE_LABELS[code],
      })),
      products: PRODUCT_TYPE_LABELS,
      guarantees: GUARANTEE_TYPE_LABELS,
      verdicts: VERDICT_DECISION_LABELS,
      decisionFactors: DEFAULT_DECISION_FACTORS,
      ratesSeed: DEFAULT_RATES_CONFIG,
      semaphoreSeed: DEFAULT_SEMAPHORE_CONFIG,
      authorizationSeed: DEFAULT_AUTHORIZATION_POLICY,
      permissions: PERMISSIONS,
    };
  }
}
