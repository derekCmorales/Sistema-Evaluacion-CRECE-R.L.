import { describe, expect, it } from "vitest";
import { InvariantViolationError, ValidationError, toPersonId, toUserId } from "@crece/shared";
import { assignDpi, createProspect, normalizeDpi } from "./person-identity";
import type { Person } from "./entities";

const mario = toUserId("user-mario");

describe("normalizeDpi", () => {
  it("acepta 13 dígitos con espacios o guiones de captura", () => {
    expect(normalizeDpi("2345 67890 0101")).toBe("2345678900101");
    expect(normalizeDpi("2345-67890-0101")).toBe("2345678900101");
  });

  it("rechaza lo que no son 13 dígitos", () => {
    expect(() => normalizeDpi("1234567890")).toThrow(ValidationError);
    expect(() => normalizeDpi("234567890A101")).toThrow(ValidationError);
    expect(() => normalizeDpi(undefined)).toThrow(ValidationError);
  });
});

describe("createProspect", () => {
  const base = {
    fullName: "Marco Antonio López",
    contacts: { phone: "55551234" },
    interest: "CREDIT" as const,
  };

  it("un registro del asesor nace PROSPECT, igual que uno de la landing", () => {
    const fromAgency = createProspect({ ...base, source: "ADVISOR", registeredByUserId: mario, dpi: "2345 67890 0101" });
    const fromLanding = createProspect({ ...base, source: "LANDING" });
    expect(fromAgency.status).toBe("PROSPECT");
    expect(fromLanding.status).toBe("PROSPECT");
    expect(fromAgency.dpi).toBe("2345678900101");
  });

  it("registrar una persona no abre ninguna operación", () => {
    const person = createProspect({ ...base, source: "ADVISOR", registeredByUserId: mario });
    expect(person).not.toHaveProperty("operations");
    expect(person).not.toHaveProperty("operationId");
  });

  it("un registro en agencia exige saber quién lo capturó", () => {
    expect(() => createProspect({ ...base, source: "ADVISOR" })).toThrow(InvariantViolationError);
  });
});

describe("assignDpi", () => {
  const prospect: Person = {
    id: toPersonId("p-1"),
    fullName: "Marco Antonio López",
    contacts: { phone: "55551234" },
    status: "PROSPECT",
    source: "LANDING",
    createdAt: "2026-09-30T00:00:00.000Z",
  };

  it("completa el DPI de un prospecto que llegó por la landing", () => {
    expect(assignDpi(prospect, "2345-67890-0101").dpi).toBe("2345678900101");
  });

  it("no reemplaza un DPI ya asignado por otro distinto", () => {
    const withDpi = { ...prospect, dpi: "2345678900101" };
    expect(assignDpi(withDpi, "2345678900101").dpi).toBe("2345678900101");
    expect(() => assignDpi(withDpi, "1111111111111")).toThrow(InvariantViolationError);
  });
});
