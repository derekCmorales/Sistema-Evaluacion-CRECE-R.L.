import {
  ValidationError,
  money,
  toPersonId,
  type GuaranteeType,
  type Money,
  type PersonId,
  type ProductType,
} from "@crece/shared";

const VALID_PRODUCTS: ProductType[] = ["WORKING_CAPITAL", "INVESTMENT", "MICROCREDIT"];
const VALID_GUARANTEES: GuaranteeType[] = ["MORTGAGE", "PLEDGE", "PERSONAL", "MIXED"];

/** Apertura de solicitud (fase 2). Quién la abre sale de la sesión, no del cuerpo. */
export type OpenDraftOperationInput = {
  personId: PersonId;
  productType: ProductType;
  guaranteeType: GuaranteeType;
  requestedAmount: Money;
  termMonths: number;
  purpose: string;
  hasGuarantor: boolean;
};

export function parseOpenDraftOperation(input: unknown): OpenDraftOperationInput {
  if (typeof input !== "object" || input === null) {
    throw new ValidationError("Cuerpo de apertura de solicitud inválido");
  }
  const body = input as Record<string, unknown>;
  const personId = String(body.personId ?? "").trim();
  const productType = body.productType as ProductType;
  const guaranteeType = body.guaranteeType as GuaranteeType;
  const amount = Number(body.requestedAmount);
  const termMonths = Number(body.termMonths);
  const purpose = String(body.purpose ?? "").trim();

  if (personId.length === 0) {
    throw new ValidationError("Elige al solicitante de la solicitud");
  }
  if (!VALID_PRODUCTS.includes(productType)) {
    throw new ValidationError("Elige un producto de crédito válido");
  }
  if (!VALID_GUARANTEES.includes(guaranteeType)) {
    throw new ValidationError("Elige un tipo de garantía válido");
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ValidationError("El monto solicitado debe ser mayor que cero");
  }
  if (!Number.isInteger(termMonths) || termMonths < 1) {
    throw new ValidationError("El plazo debe ser un número entero de meses (1 o más)");
  }
  if (purpose.length < 3) {
    throw new ValidationError("Describe el destino del crédito");
  }
  if (typeof body.hasGuarantor !== "boolean") {
    throw new ValidationError("Indica si la solicitud lleva fiador");
  }

  return {
    personId: toPersonId(personId),
    productType,
    guaranteeType,
    requestedAmount: money(amount),
    termMonths,
    purpose,
    hasGuarantor: body.hasGuarantor,
  };
}
