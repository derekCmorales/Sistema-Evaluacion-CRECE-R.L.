import { describe, expect, it } from "vitest";
import { formatGtq, maskDpi } from "./format";

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

describe("maskDpi", () => {
  it("deja visibles los extremos y oculta el centro", () => {
    expect(maskDpi("2345678900101")).toBe("2345•••••0101");
    expect(maskDpi("2345 67890 0101")).toBe("2345•••••0101");
  });

  it("no revela un valor que no es DPI", () => {
    expect(maskDpi("123")).toBe("•••••••••••••");
  });
});
