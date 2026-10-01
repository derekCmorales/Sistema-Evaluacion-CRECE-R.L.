import { describe, expect, it } from "vitest";
import { ValidationError } from "@crece/shared";
import { parsePublicProspect } from "./public-prospect";

describe("public-prospect", () => {
  const valid = {
    fullName: "Marco Pérez",
    phone: "55551234",
    interest: "CREDIT",
    source: "LANDING",
    consentContact: true,
  };

  it("valida el formulario público", () => {
    expect(parsePublicProspect(valid)).toMatchObject({ fullName: "Marco Pérez", source: "LANDING" });
  });

  it("exige consentimiento y teléfono", () => {
    expect(() => parsePublicProspect({ ...valid, consentContact: false })).toThrow(ValidationError);
    expect(() => parsePublicProspect({ ...valid, phone: "12" })).toThrow(ValidationError);
  });
});
