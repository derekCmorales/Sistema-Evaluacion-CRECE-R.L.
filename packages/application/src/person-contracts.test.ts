import { describe, expect, it } from "vitest";
import { ValidationError } from "@crece/shared";
import { parseDpiBody, parseRegisterPerson } from "./person-contracts";

describe("person-contracts", () => {
  const valid = {
    fullName: "Marco Antonio López",
    dpi: "2345 67890 0101",
    phone: "5555 1234",
    email: "marco@ejemplo.com",
    interest: "CREDIT",
  };

  it("valida el registro en agencia y normaliza el DPI", () => {
    const parsed = parseRegisterPerson(valid);
    expect(parsed.dpi).toBe("2345678900101");
    expect(parsed.email).toBe("marco@ejemplo.com");
  });

  it("ignora origen y registrador del cuerpo: salen del canal y de la sesión", () => {
    const parsed = parseRegisterPerson({ ...valid, source: "LANDING", registeredByUserId: "otro" });
    expect(parsed).not.toHaveProperty("source");
    expect(parsed).not.toHaveProperty("registeredByUserId");
  });

  it("falla ante nombre corto, teléfono corto, interés o correo inválidos", () => {
    expect(() => parseRegisterPerson({ ...valid, fullName: "Al" })).toThrow(ValidationError);
    expect(() => parseRegisterPerson({ ...valid, phone: "1234" })).toThrow(ValidationError);
    expect(() => parseRegisterPerson({ ...valid, interest: "LOAN" })).toThrow(ValidationError);
    expect(() => parseRegisterPerson({ ...valid, email: "marco@" })).toThrow(ValidationError);
    expect(() => parseRegisterPerson({ ...valid, dpi: "123" })).toThrow(ValidationError);
  });

  it("el DPI de búsqueda viaja en el cuerpo y se normaliza", () => {
    expect(parseDpiBody({ dpi: "2345-67890-0101" })).toBe("2345678900101");
    expect(() => parseDpiBody({})).toThrow(ValidationError);
  });
});
