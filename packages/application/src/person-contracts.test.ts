import { describe, expect, it } from "vitest";
import { ValidationError } from "@crece/shared";
import {
  normalizeDpi,
  parseCreatePerson,
  toPersonEntity,
} from "./person-contracts";

describe("person-contracts", () => {
  describe("normalizeDpi", () => {
    it("acepta DPI válido de 13 dígitos y remueve espacios o guiones", () => {
      expect(normalizeDpi("2345 67890 0101")).toBe("2345678900101");
      expect(normalizeDpi("2345-67890-0101")).toBe("2345678900101");
      expect(normalizeDpi("2345678900101")).toBe("2345678900101");
    });

    it("falla si el DPI no tiene exactamente 13 dígitos numéricos", () => {
      expect(() => normalizeDpi("1234567890")).toThrow(ValidationError);
      expect(() => normalizeDpi("234567890010199")).toThrow(ValidationError);
      expect(() => normalizeDpi("234567890A101")).toThrow(ValidationError);
      expect(() => normalizeDpi(null)).toThrow(ValidationError);
    });
  });

  describe("parseCreatePerson", () => {
    it("valida y parsea un solicitante registrado por asesor", () => {
      const parsed = parseCreatePerson({
        fullName: "Mario René Gómez Pérez",
        dpi: "2345 67890 0101",
        phone: "55551234",
        email: "mario.gomez@ejemplo.com",
        interest: "CREDIT",
        source: "ADVISOR",
        registeredByUserId: "user-jefe-agencia-mario",
      });

      expect(parsed.fullName).toBe("Mario René Gómez Pérez");
      expect(parsed.dpi).toBe("2345678900101");
      expect(parsed.source).toBe("ADVISOR");
      expect(parsed.registeredByUserId).toBe("user-jefe-agencia-mario");
    });

    it("exige registrar el usuario si el origen es ADVISOR", () => {
      expect(() =>
        parseCreatePerson({
          fullName: "Mario René Gómez Pérez",
          dpi: "2345678900101",
          phone: "55551234",
          interest: "CREDIT",
          source: "ADVISOR",
        }),
      ).toThrow(ValidationError);
    });

    it("permite registrar prospecto desde LANDING sin usuario interno", () => {
      const parsed = parseCreatePerson({
        fullName: "Carlos Morales",
        dpi: "2345678900101",
        phone: "55554321",
        interest: "SAVINGS",
        source: "LANDING",
      });

      expect(parsed.source).toBe("LANDING");
      expect(parsed.registeredByUserId).toBeUndefined();
    });

    it("falla ante nombre corto o producto inválido", () => {
      expect(() =>
        parseCreatePerson({
          fullName: "Ab",
          dpi: "2345678900101",
          phone: "55554321",
          interest: "CREDIT",
          source: "LANDING",
        }),
      ).toThrow(ValidationError);

      expect(() =>
        parseCreatePerson({
          fullName: "Nombre Valido",
          dpi: "2345678900101",
          phone: "55554321",
          interest: "OTRO_INVALIDO",
          source: "LANDING",
        }),
      ).toThrow(ValidationError);
    });
  });

  describe("toPersonEntity", () => {
    it("crea la entidad Person con estado acorde al origen", () => {
      const input = parseCreatePerson({
        fullName: "Mario Gómez",
        dpi: "2345678900101",
        phone: "55551234",
        interest: "CREDIT",
        source: "ADVISOR",
        registeredByUserId: "user-mario",
      });

      const person = toPersonEntity(input, "person-101", "2026-09-26T12:00:00.000Z");
      expect(person.id).toBe("person-101");
      expect(person.status).toBe("ACTIVE");
      expect(person.registeredByUserId).toBe("user-mario");
    });
  });
});
