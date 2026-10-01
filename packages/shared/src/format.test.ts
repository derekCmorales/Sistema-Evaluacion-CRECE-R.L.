import { describe, expect, it } from "vitest";
import { formatDpi, formatGtq, maskDpi } from "./format";

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

describe("DPI para mostrar", () => {
  it("agrupa el DPI en 4-5-4", () => {
    expect(formatDpi("2345678900101")).toBe("2345 67890 0101");
  });

  it("en listados enmascara todo salvo los últimos 4 dígitos", () => {
    expect(maskDpi("2345678900101")).toBe("•••• ••••• 0101");
    expect(maskDpi("2345678900101")).not.toContain("23456");
  });
});
