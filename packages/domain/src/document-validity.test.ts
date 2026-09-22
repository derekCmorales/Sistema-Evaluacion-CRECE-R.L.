import { describe, expect, it } from "vitest";
import { resolveDocumentValidity } from "./document-validity";

describe("document-validity", () => {
  const now = new Date("2026-06-15T12:00:00.000Z");

  it("devuelve null si falta emisión o vigencia", () => {
    expect(resolveDocumentValidity({ now })).toBeNull();
    expect(resolveDocumentValidity({ issuedAt: "2026-01-01", now })).toBeNull();
    expect(resolveDocumentValidity({ validityDays: 90, now })).toBeNull();
  });

  it("es VALID dentro de la ventana", () => {
    expect(
      resolveDocumentValidity({
        issuedAt: "2026-05-01T00:00:00.000Z",
        validityDays: 90,
        now,
      }),
    ).toBe("VALID");
  });

  it("es EXPIRING a 30 días o menos del vencimiento", () => {
    expect(
      resolveDocumentValidity({
        issuedAt: "2026-03-20T00:00:00.000Z",
        validityDays: 90,
        now,
      }),
    ).toBe("EXPIRING");
  });

  it("es EXPIRED fuera de vigencia", () => {
    expect(
      resolveDocumentValidity({
        issuedAt: "2026-01-01T00:00:00.000Z",
        validityDays: 90,
        now,
      }),
    ).toBe("EXPIRED");
  });
});
