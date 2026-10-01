import {
  InvariantViolationError,
  ValidationError,
  type PersonSource,
  type ProspectInterest,
  type UserId,
} from "@crece/shared";
import type { ContactInfo, Person } from "./entities";

/**
 * DPI guatemalteco (CUI): 13 dígitos. Acepta espacios y guiones de captura
 * (`2345 67890 0101`, `2345-67890-0101`) y devuelve solo dígitos.
 */
export function normalizeDpi(raw: unknown): string {
  if (typeof raw !== "string") {
    throw new ValidationError("El DPI es obligatorio");
  }
  const digits = raw.replace(/[\s-]/g, "");
  if (!/^\d{13}$/.test(digits)) {
    throw new ValidationError("El DPI debe tener 13 dígitos");
  }
  return digits;
}

export type NewProspect = {
  fullName: string;
  contacts: ContactInfo;
  source: PersonSource;
  interest: ProspectInterest;
  dpi?: string;
  registeredByUserId?: UserId;
  intakeNote?: Person["intakeNote"];
  contactConsentAt?: string;
};

/**
 * Toda persona nace como prospecto, llegue por la landing o la registre un asesor.
 * Pasa a activa solo con la primera aprobación (folder de identidad); nunca al registrarse,
 * y registrarla no abre ninguna operación.
 */
export function createProspect(input: NewProspect): Omit<Person, "id" | "createdAt"> {
  if (input.source === "ADVISOR" && !input.registeredByUserId) {
    throw new InvariantViolationError("Un registro en agencia debe indicar quién lo capturó");
  }
  return {
    fullName: input.fullName,
    contacts: input.contacts,
    dpi: input.dpi === undefined ? undefined : normalizeDpi(input.dpi),
    status: "PROSPECT",
    source: input.source,
    interest: input.interest,
    registeredByUserId: input.registeredByUserId,
    intakeNote: input.intakeNote,
    contactConsentAt: input.contactConsentAt,
  };
}

/**
 * Completa el DPI de un prospecto que llegó sin él (landing). El DPI es la identidad:
 * una vez asignado no se reemplaza por otro.
 */
export function assignDpi(person: Person, rawDpi: string): Person {
  const dpi = normalizeDpi(rawDpi);
  if (person.dpi && person.dpi !== dpi) {
    throw new InvariantViolationError("Esta persona ya tiene otro DPI registrado; el DPI no se reemplaza");
  }
  return { ...person, dpi };
}
