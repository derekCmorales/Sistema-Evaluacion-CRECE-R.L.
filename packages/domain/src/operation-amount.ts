import type { Money } from "@crece/shared";
import type { Operation } from "./entities";

export function getEffectiveAmount(operation: Operation): Money {
  return operation.approvedAmount ?? operation.requestedAmount;
}

export function getEffectiveTermMonths(operation: Operation): number {
  return operation.approvedTermMonths ?? operation.termMonths;
}

export function getEffectiveAmountNumber(operation: Operation): number {
  return Number(getEffectiveAmount(operation).amount);
}
