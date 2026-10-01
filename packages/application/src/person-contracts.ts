import { ValidationError, type ProspectInterest } from "@crece/shared";
import { normalizeDpi } from "@crece/domain";

const VALID_INTERESTS: ProspectInterest[] = ["CREDIT", "SAVINGS", "FIXED_TERM"];

/** Registro en agencia (fase 1). El origen y quién registra salen del canal y de la sesión, no del cuerpo. */
export type RegisterPersonInput = {
  fullName: string;
  dpi: string;
  phone: string;
  email?: string;
  interest: ProspectInterest;
};

export function parseRegisterPerson(input: unknown): RegisterPersonInput {
  const body = asRecord(input, "Cuerpo de registro de persona inválido");
  const fullName = String(body.fullName ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const interest = body.interest as ProspectInterest;

  if (fullName.length < 3) {
    throw new ValidationError("Escribe el nombre completo (al menos 3 caracteres)");
  }
  const dpi = normalizeDpi(body.dpi);
  if (phone.replace(/\D/g, "").length < 8) {
    throw new ValidationError("El teléfono debe tener al menos 8 dígitos");
  }
  if (!VALID_INTERESTS.includes(interest)) {
    throw new ValidationError("El producto de interés debe ser crédito, ahorro o plazo fijo");
  }
  const email = typeof body.email === "string" && body.email.trim().length > 0 ? body.email.trim() : undefined;
  if (email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ValidationError("Revisa el correo: debe tener la forma nombre@dominio.com");
  }

  return { fullName, dpi, phone, email, interest };
}

/** Búsqueda o asignación de DPI: el DPI viaja en el cuerpo, nunca en la URL. */
export function parseDpiBody(input: unknown): string {
  return normalizeDpi(asRecord(input, "Cuerpo inválido").dpi);
}

function asRecord(input: unknown, message: string): Record<string, unknown> {
  if (typeof input !== "object" || input === null) {
    throw new ValidationError(message);
  }
  return input as Record<string, unknown>;
}
