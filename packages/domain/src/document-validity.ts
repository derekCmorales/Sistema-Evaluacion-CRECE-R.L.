import type { DocumentValidityStatus } from "@crece/shared";

export type DocumentValidityInput = {
  issuedAt?: string;
  validityDays?: number;
  now?: Date;
  warningDays?: number;
};

/**
 * Vencido avisa, no bloquea. El único bloqueo duro de documentos es
 * pasar a PACKAGED sin casillas críticas.
 */
export function resolveDocumentValidity(
  input: DocumentValidityInput,
): DocumentValidityStatus | null {
  if (!input.issuedAt || !input.validityDays) return null;

  const issued = new Date(input.issuedAt);
  const now = input.now ?? new Date();
  const expiresAt = new Date(issued);
  expiresAt.setUTCDate(expiresAt.getUTCDate() + input.validityDays);

  if (now > expiresAt) return "EXPIRED";

  const warningDays = input.warningDays ?? 30;
  const warningAt = new Date(expiresAt);
  warningAt.setUTCDate(warningAt.getUTCDate() - warningDays);
  if (now >= warningAt) return "EXPIRING";

  return "VALID";
}
