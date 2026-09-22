import { describe, expect, it } from "vitest";
import { InvalidTransitionError } from "@crece/shared";
import {
  assertTransition,
  canTransition,
  getAllowedTransitions,
} from "./operation-state-machine";

describe("operation-state-machine", () => {
  it("permite Draft → ReadyForReview → UnderReview → Approved → Packaged", () => {
    expect(canTransition("DRAFT", "READY_FOR_REVIEW")).toBe(true);
    expect(canTransition("READY_FOR_REVIEW", "UNDER_REVIEW")).toBe(true);
    expect(canTransition("UNDER_REVIEW", "APPROVED")).toBe(true);
    expect(canTransition("APPROVED", "PACKAGED")).toBe(true);
  });

  it("permite devolver al asesor y reabrir borrador", () => {
    expect(canTransition("UNDER_REVIEW", "RETURNED_TO_ADVISOR")).toBe(true);
    expect(canTransition("RETURNED_TO_ADVISOR", "READY_FOR_REVIEW")).toBe(true);
    expect(canTransition("RETURNED_TO_ADVISOR", "DRAFT")).toBe(true);
  });

  it("rechaza transiciones ilegales", () => {
    expect(canTransition("DRAFT", "APPROVED")).toBe(false);
    expect(canTransition("REJECTED", "APPROVED")).toBe(false);
    expect(getAllowedTransitions("PACKAGED")).toEqual([]);
    expect(() => assertTransition("DRAFT", "PACKAGED")).toThrow(
      InvalidTransitionError,
    );
  });
});
