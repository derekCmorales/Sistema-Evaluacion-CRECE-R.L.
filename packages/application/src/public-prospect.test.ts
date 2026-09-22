import { describe, expect, it } from "vitest";
import { ValidationError } from "@crece/shared";
import { parsePublicProspect, toProspectPerson } from "./public-prospect";

describe("public-prospect", () => {
  const valid = {
    fullName: "Marco Pérez",
    phone: "55551234",
    interest: "CREDIT",
    source: "LANDING",
    consentContact: true,
  };

  it("crea solo Person en estado PROSPECT", () => {
    const parsed = parsePublicProspect(valid);
    const person = toProspectPerson(parsed, "p-1", "2026-09-22T00:00:00.000Z");
    expect(person.status).toBe("PROSPECT");
    expect(person.fullName).toBe("Marco Pérez");
    expect(person).not.toHaveProperty("operations");
  });

  it("exige consentimiento y teléfono", () => {
    expect(() =>
      parsePublicProspect({ ...valid, consentContact: false }),
    ).toThrow(ValidationError);
    expect(() => parsePublicProspect({ ...valid, phone: "12" })).toThrow(
      ValidationError,
    );
  });
});
