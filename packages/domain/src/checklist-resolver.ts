import type {
  ChecklistItemStatus,
  GuaranteeType,
  ProductType,
} from "@crece/shared";

export type ChecklistTemplateItem = {
  code: string;
  label: string;
  required: boolean;
  validityDays?: number;
  critical?: boolean;
};

export type ChecklistItem = {
  code: string;
  label: string;
  required: boolean;
  status: ChecklistItemStatus;
  notApplicableReason?: string;
  documentId?: string;
  issuedAt?: string;
  validityDays?: number;
  critical?: boolean;
};

/**
 * Semilla de plantilla. En producción las casillas viven en DB versionada
 * (`ChecklistTemplate`). Esta lista refleja el expediente real (reunión 3).
 */
const BASE_ITEMS: ChecklistTemplateItem[] = [
  { code: "DPI", label: "DPI vigente", required: true, validityDays: 3650, critical: true },
  {
    code: "BUREAU_CONSENT",
    label: "Consentimiento buró",
    required: true,
    critical: true,
  },
  { code: "UTILITY_BILL", label: "Recibo de servicios", required: true, validityDays: 90 },
  { code: "BUREAU", label: "Buró de crédito", required: true, validityDays: 30, critical: true },
  { code: "SPOUSE_DPI", label: "DPI cónyuge (si aplica)", required: false, validityDays: 3650 },
  { code: "BUSINESS_PHOTOS", label: "Fotografías del negocio", required: true },
  { code: "FINANCIAL_STATEMENT", label: "Estado de resultados / ventas", required: true },
  { code: "BANK_STATEMENT", label: "Estado de cuenta bancario", required: false },
  { code: "TAX_DECLARATION", label: "Declaración SAT", required: false },
];

const GUARANTEE_ITEMS: Record<GuaranteeType, ChecklistTemplateItem[]> = {
  MORTGAGE: [
    { code: "PROPERTY_DEED", label: "Escritura / garantía hipotecaria", required: true },
    { code: "APPRAISAL", label: "Avalúo", required: true, validityDays: 365 },
  ],
  PLEDGE: [
    { code: "PLEDGE_DOC", label: "Documento de prenda", required: true },
    { code: "INVENTORY", label: "Inventario de garantía", required: true },
  ],
  PERSONAL: [],
  MIXED: [
    { code: "GUARANTEE_DOCS", label: "Documentos de garantía mixta", required: true },
  ],
};

const PRODUCT_ITEMS: Record<ProductType, ChecklistTemplateItem[]> = {
  WORKING_CAPITAL: [
    { code: "PURPOSE_LETTER", label: "Carta de destino del crédito", required: true },
  ],
  INVESTMENT: [
    { code: "INVESTMENT_PLAN", label: "Plan de inversión", required: true },
    { code: "QUOTES", label: "Cotizaciones", required: false },
  ],
  MICROCREDIT: [
    { code: "GROUP_MINUTES", label: "Acta de grupo (si aplica)", required: false },
  ],
};

const GUARANTOR_ITEMS: ChecklistTemplateItem[] = [
  { code: "GUARANTOR_DPI", label: "DPI del fiador", required: true, critical: true },
  { code: "GUARANTOR_INCOME", label: "Comprobante de ingresos del fiador", required: true },
  { code: "GUARANTOR_BUREAU", label: "Buró del fiador", required: true },
];

export type ChecklistResolverInput = {
  productType: ProductType;
  guaranteeType: GuaranteeType;
  hasGuarantor: boolean;
};

export function resolveChecklistTemplate(
  input: ChecklistResolverInput,
): ChecklistTemplateItem[] {
  const items = [
    ...BASE_ITEMS,
    ...PRODUCT_ITEMS[input.productType],
    ...GUARANTEE_ITEMS[input.guaranteeType],
  ];

  if (input.hasGuarantor) {
    items.push(...GUARANTOR_ITEMS);
  }

  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.code)) return false;
    seen.add(item.code);
    return true;
  });
}

export function createChecklistItems(input: ChecklistResolverInput): ChecklistItem[] {
  return resolveChecklistTemplate(input).map((item) => ({
    ...item,
    status: "PENDING" as ChecklistItemStatus,
  }));
}

/**
 * El expediente puede avanzar incompleto con faltantes visibles.
 * N/A exige justificación. Vencido avisa, no bloquea (ver document-validity).
 */
export function isChecklistReadyForReview(items: ChecklistItem[]): boolean {
  return items.every((item) => {
    if (!item.required) return true;
    if (
      item.status === "UPLOADED" ||
      item.status === "CONFIRMED" ||
      item.status === "NOT_APPLICABLE" ||
      item.status === "MISSING_VISIBLE"
    ) {
      if (item.status === "NOT_APPLICABLE") {
        return Boolean(item.notApplicableReason?.trim());
      }
      return true;
    }
    return false;
  });
}
