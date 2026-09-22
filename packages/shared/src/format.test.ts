import { describe, expect, it } from "vitest";
import { formatGtq } from "./format";

describe("formatGtq", () => {
  it("formatea miles con prefijo Q y dos decimales", () => {
    expect(formatGtq(40000)).toBe("Q40,000.00");
    expect(formatGtq("150000")).toBe("Q150,000.00");
  });

  it("maneja centavos y valores inválidos", () => {
    expect(formatGtq(1234.5)).toBe("Q1,234.50");
    expect(formatGtq("not-a-number")).toBe("Q0.00");
  });
});
