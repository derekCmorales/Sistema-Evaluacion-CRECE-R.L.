import {
  ValidationError,
  toPersonId,
  type PersonStatus,
  type ProspectInterest,
  type ProspectSource,
} from "@crece/shared";
import type { Person } from "@crece/domain";

export type PublicProspectInput = {
  fullName: string;
  phone: string;
  email?: string;
  interest: ProspectInterest;
  amountHint?: number;
  message?: string;
  source: ProspectSource;
  consentContact: boolean;
};

const INTERESTS: ProspectInterest[] = ["CREDIT", "SAVINGS", "FIXED_TERM"];

/**
 * Contrato landing → sistema (AGENTS §9).
 * Crea **solo** Person en estado PROSPECT. No crea Operation:
 * producto, garantía y destino los define un humano.
 */
export function parsePublicProspect(input: unknown): PublicProspectInput {
  if (typeof input !== "object" || input === null) {
    throw new ValidationError("Cuerpo de prospecto inválido");
  }
  const body = input as Record<string, unknown>;
  const fullName = String(body.fullName ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const interest = body.interest as ProspectInterest;
  const source = (body.source as ProspectSource | undefined) ?? "LANDING";
  const consentContact = body.consentContact === true;

  if (fullName.length < 3) {
    throw new ValidationError("El nombre completo es obligatorio");
  }
  if (phone.length < 8) {
    throw new ValidationError("El teléfono es obligatorio");
  }
  if (!INTERESTS.includes(interest)) {
    throw new ValidationError("El interés debe ser CREDIT, SAVINGS o FIXED_TERM");
  }
  if (source !== "LANDING" && source !== "ADVISOR") {
    throw new ValidationError("Origen inválido");
  }
  if (!consentContact) {
    throw new ValidationError("Se requiere consentimiento de contacto");
  }

  const email = typeof body.email === "string" ? body.email.trim() : undefined;
  const amountHint =
    typeof body.amountHint === "number" && Number.isFinite(body.amountHint)
      ? body.amountHint
      : undefined;
  const message =
    typeof body.message === "string" ? body.message.trim() : undefined;

  return {
    fullName,
    phone,
    email: email || undefined,
    interest,
    amountHint,
    message: message || undefined,
    source,
    consentContact,
  };
}

export function toProspectPerson(
  input: PublicProspectInput,
  id: string,
  now = new Date().toISOString(),
): Person {
  return {
    id: toPersonId(id),
    fullName: input.fullName,
    contacts: { phone: input.phone, email: input.email },
    status: "PROSPECT" as PersonStatus,
    createdAt: now,
  };
}
