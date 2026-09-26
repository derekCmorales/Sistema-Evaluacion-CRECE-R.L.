import {
  ValidationError,
  money,
  toOperationId,
  toPersonId,
  toUserId,
  type CreateDraftOperationInput,
  type GuaranteeType,
  type ProductType,
} from "@crece/shared";
import { createChecklistItems, type Operation } from "@crece/domain";

const VALID_PRODUCTS: ProductType[] = [
  "WORKING_CAPITAL",
  "INVESTMENT",
  "MICROCREDIT",
];

const VALID_GUARANTEES: GuaranteeType[] = [
  "MORTGAGE",
  "PLEDGE",
  "PERSONAL",
  "MIXED",
];

/**
 * Contrato de apertura de solicitud de crédito (Fase 2).
 * Valida parámetros iniciales y genera la solicitud en estado DRAFT con su checklist.
 */
export function parseCreateDraftOperation(input: unknown): CreateDraftOperationInput {
  if (typeof input !== "object" || input === null) {
    throw new ValidationError("Cuerpo de apertura de solicitud inválido");
  }

  const body = input as Record<string, unknown>;
  const personId = String(body.personId ?? "").trim();
  const productType = body.productType as ProductType;
  const guaranteeType = body.guaranteeType as GuaranteeType;
  const amount = Number(body.requestedAmount ?? body.amount);
  const termMonths = Number(body.termMonths);
  const purpose = String(body.purpose ?? "").trim();
  const hasGuarantor = Boolean(body.hasGuarantor);
  const createdBy = String(body.createdBy ?? "").trim();

  if (personId.length === 0) {
    throw new ValidationError("El identificador del solicitante (personId) es obligatorio");
  }

  if (!VALID_PRODUCTS.includes(productType)) {
    throw new ValidationError("Tipo de producto de crédito inválido");
  }

  if (!VALID_GUARANTEES.includes(guaranteeType)) {
    throw new ValidationError("Tipo de garantía inválido");
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ValidationError("El monto solicitado debe ser un número positivo");
  }

  if (!Number.isInteger(termMonths) || termMonths < 1) {
    throw new ValidationError("El plazo en meses debe ser un entero mayor o igual a 1");
  }

  if (purpose.length < 3) {
    throw new ValidationError("El destino del crédito es obligatorio y debe describirse");
  }

  if (createdBy.length === 0) {
    throw new ValidationError("Se requiere el usuario que apertura la solicitud");
  }

  return {
    personId: toPersonId(personId),
    productType,
    guaranteeType,
    requestedAmount: money(amount),
    termMonths,
    purpose,
    hasGuarantor,
    createdBy: toUserId(createdBy),
  };
}

/**
 * Instancia la entidad Operation en estado borrador (DRAFT)
 * y resuelve automáticamente la lista de requisitos inicial dinámica.
 */
export function toDraftOperationEntity(
  input: CreateDraftOperationInput,
  operationId: string,
  now = new Date().toISOString(),
): Operation {
  const checklist = createChecklistItems({
    productType: input.productType,
    guaranteeType: input.guaranteeType,
    hasGuarantor: input.hasGuarantor,
  });

  return {
    id: toOperationId(operationId),
    personId: input.personId,
    productType: input.productType,
    guaranteeType: input.guaranteeType,
    hasGuarantor: input.hasGuarantor,
    requestedAmount: input.requestedAmount,
    termMonths: input.termMonths,
    purpose: input.purpose,
    state: "DRAFT",
    checklist,
    hardRuleHits: [],
    verdicts: [],
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
  };
}
