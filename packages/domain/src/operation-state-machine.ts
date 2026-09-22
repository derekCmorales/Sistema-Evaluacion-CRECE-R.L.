import type { OperationState } from "@crece/shared";
import { InvalidTransitionError } from "@crece/shared";

const ALLOWED_TRANSITIONS: Record<OperationState, OperationState[]> = {
  DRAFT: ["READY_FOR_REVIEW"],
  READY_FOR_REVIEW: ["UNDER_REVIEW", "DRAFT"],
  UNDER_REVIEW: ["RETURNED_TO_ADVISOR", "APPROVED", "REJECTED"],
  RETURNED_TO_ADVISOR: ["READY_FOR_REVIEW", "DRAFT"],
  APPROVED: ["PACKAGED"],
  REJECTED: [],
  PACKAGED: [],
};

export function assertTransition(from: OperationState, to: OperationState): void {
  if (!ALLOWED_TRANSITIONS[from].includes(to)) {
    throw new InvalidTransitionError(from, to);
  }
}

export function canTransition(from: OperationState, to: OperationState): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function getAllowedTransitions(from: OperationState): OperationState[] {
  return [...ALLOWED_TRANSITIONS[from]];
}
