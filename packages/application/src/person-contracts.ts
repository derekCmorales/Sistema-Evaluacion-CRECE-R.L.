import {
  ValidationError,
  toPersonId,
  toUserId,
  type CreatePersonInput,
  type PersonSource,
  type ProspectInterest,
} from "@crece/shared";
import type { Person } from "@crece/domain";

const VALID_INTERESTS: ProspectInterest[] = ["CREDIT", "SAVINGS", "FIXED_TERM"];
const VALID_SOURCES: PersonSource[] = ["LANDING", "ADVISOR"];

/**
 * Normaliza y valida un DPI guatemalteco (13 dígitos numéricos).
 * Remueve espacios y guiones comunes (ej: "2345 67890 0101" -> "2345678900101").
 */
export function normalizeDpi(rawDpi: unknown): string {
  if (typeof rawDpi !== "string") {
    throw new ValidationError("El DPI debe ser una cadena de texto");
  }
  const clean = rawDpi.replace(/[\s-]/g, "");
  if (!/^\d{13}$/.test(clean)) {
    throw new ValidationError("El DPI debe contener exactamente 13 dígitos numéricos");
  }
  return clean;
}

/**
 * Contrato de registro del solicitante (Fase 1).
 * Valida unicidad de perfil, datos de contacto, origen y auditoría de quién registró.
 */
export function parseCreatePerson(input: unknown): CreatePersonInput {
  if (typeof input !== "object" || input === null) {
    throw new ValidationError("Cuerpo de registro de persona inválido");
  }

  const body = input as Record<string, unknown>;
  const fullName = String(body.fullName ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const interest = body.interest as ProspectInterest;
  const source = body.source as PersonSource;

  if (fullName.length < 3) {
    throw new ValidationError("El nombre completo es obligatorio y debe tener al menos 3 caracteres");
  }

  const dpi = normalizeDpi(body.dpi);

  if (phone.length < 8) {
    throw new ValidationError("El número de teléfono debe tener al menos 8 dígitos");
  }

  if (!VALID_INTERESTS.includes(interest)) {
    throw new ValidationError("El producto de interés debe ser CREDIT, SAVINGS o FIXED_TERM");
  }

  if (!VALID_SOURCES.includes(source)) {
    throw new ValidationError("El origen debe ser LANDING o ADVISOR");
  }

  const email =
    typeof body.email === "string" && body.email.trim().length > 0
      ? body.email.trim()
      : undefined;

  let registeredByUserId =
    typeof body.registeredByUserId === "string" && body.registeredByUserId.trim().length > 0
      ? toUserId(body.registeredByUserId.trim())
      : undefined;

  if (source === "ADVISOR" && !registeredByUserId) {
    throw new ValidationError("Se debe registrar el usuario responsable (asesor/jefatura) que capturó al solicitante");
  }

  return {
    fullName,
    dpi,
    phone,
    email,
    interest,
    source,
    registeredByUserId,
  };
}

/**
 * Transforma el DTO validado en la entidad central Person de Dominio.
 */
export function toPersonEntity(
  input: CreatePersonInput,
  id: string,
  now = new Date().toISOString(),
): Person {
  return {
    id: toPersonId(id),
    fullName: input.fullName,
    dpi: input.dpi,
    contacts: {
      phone: input.phone,
      email: input.email,
    },
    status: input.source === "LANDING" ? "PROSPECT" : "ACTIVE",
    source: input.source,
    interest: input.interest,
    registeredByUserId: input.registeredByUserId,
    createdAt: now,
  };
}
