/**
 * Modelo propio de un documento procesado por OCR (capa anticorrupción): ningún tipo de
 * un proveedor sale de su adaptador. Páginas 1-based.
 */

export type BoundingBox = {
  /** Coordenadas normalizadas 0..1 respecto de la página. */
  x: number;
  y: number;
  width: number;
  height: number;
};

export type OcrBlock = {
  text: string;
  bbox?: BoundingBox;
  /** 0..1 */
  confidence?: number;
};

export const IMAGE_KINDS = [
  "LOGO",
  "DECORATION",
  "SIGNATURE",
  "SEAL",
  "SKETCH",
  "BUSINESS_PHOTO",
  "CHART",
  "TABLE_SCAN",
  "ID_PHOTO",
  "OTHER",
] as const;
export type ImageKind = (typeof IMAGE_KINDS)[number];

export type ImageClassification = {
  kind: ImageKind;
  relevant: boolean;
  description: string;
};

export type OcrImage = {
  id: string;
  bbox?: BoundingBox;
  classification?: ImageClassification;
};

export type OcrPage = {
  /** 1-based */
  index: number;
  markdown: string;
  header?: string;
  footer?: string;
  blocks: OcrBlock[];
  images: OcrImage[];
  /** Confianza media de la página, 0..1. */
  confidence?: number;
};

export type OcrDocument = {
  /** Id exacto del modelo que produjo el resultado (versión fijada). */
  model: string;
  pages: OcrPage[];
  /** Campos estructurados según el esquema del tipo de documento, tal cual los devolvió el proveedor. */
  annotation?: Record<string, unknown>;
  usage: { pagesProcessed: number; docSizeBytes?: number };
};

/** Campo extraído para confirmación humana; el anfitrión lo mapea a `OcrCandidate` del dominio. */
export type ExtractedFieldCandidate = {
  id: string;
  fieldKey: string;
  fieldLabel: string;
  value: string;
  page?: number;
  confidence?: number;
  needsAttention: boolean;
  /** Motivo legible cuando `needsAttention` (baja confianza, formato dudoso…). */
  attentionReason?: string;
};

/** Resultado normalizado de una extracción (lo que el motor persiste y expone). */
export type DocumentExtraction = {
  id: string;
  fileSha256: string;
  ocrModel: string;
  documentType: string;
  schemaCode: string;
  schemaVersion: number;
  pages: Array<{ index: number; text: string; header?: string; footer?: string; confidence?: number }>;
  candidates: ExtractedFieldCandidate[];
  images: Array<{ page: number; id: string; kind: ImageKind; relevant: boolean; description: string }>;
  createdAt: string;
  isLab: boolean;
};
