import { DOCUMENT_TYPES, type DocumentType } from "./contracts/common";
import { resolveDocumentSchema } from "./extraction/document-schemas";

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  DPI: "DPI",
  BUREAU_REPORT: "Reporte de buró",
  INCOME_RECEIPT: "Constancia o recibo de ingresos",
  BANK_STATEMENT: "Estado de cuenta",
  UTILITY_BILL: "Recibo de servicio",
  BUSINESS_PHOTO: "Fotografía del negocio",
  SKETCH: "Croquis de ubicación",
  POLICY: "Política de CRECE",
  OTHER: "Otro documento",
};

export type DocumentTypeInfo = {
  type: DocumentType;
  label: string;
  schemaCode: string;
  schemaVersion: number;
  classifiesImages: boolean;
  fields: Array<{ key: string; label: string }>;
};

/** Catálogo público para la UI: qué tipos existen y qué campos se extraen de cada uno. */
export function documentTypeCatalog(): DocumentTypeInfo[] {
  return DOCUMENT_TYPES.map((type) => {
    const resolved = resolveDocumentSchema(type);
    return {
      type,
      label: DOCUMENT_TYPE_LABELS[type],
      schemaCode: resolved.code,
      schemaVersion: resolved.version,
      classifiesImages: resolved.classifyImages,
      fields: (resolved.schema?.fields ?? []).map((f) => ({ key: f.key, label: f.label })),
    };
  });
}
