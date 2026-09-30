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

/**
 * Campo extraído para confirmación humana; el anfitrión lo mapea a `OcrCandidate` del dominio.
 * El `id` es estable dentro de la extracción; como una extracción deduplicada se comparte entre
 * documentos con los mismos bytes, el anfitrión identifica una confirmación por (documentRef, id).
 */
export type ExtractedFieldCandidate = {
  id: string;
  fieldKey: string;
  fieldLabel: string;
  value: string;
  page?: number;
  /** Región del bloque donde se ubicó el valor, si el proveedor la devolvió. */
  bbox?: BoundingBox;
  confidence?: number;
  needsAttention: boolean;
  /** Motivo legible cuando `needsAttention` (baja confianza, formato dudoso…). */
  attentionReason?: string;
};

/**
 * Texto del documento con forma de instrucción dirigida a una IA. Es una señal para revisión
 * humana, nunca un bloqueo: el documento se procesa igual como dato.
 */
export type InjectionSignal = {
  /** Id del patrón que coincidió (configuración `safety.injectionPatterns`). */
  patternId: string;
  /** Fragmento del texto de la página (máx. 160 caracteres) para ubicarlo. */
  excerpt: string;
};

/** Resultado normalizado de una extracción (lo que el motor persiste y expone). */
export type DocumentExtraction = {
  id: string;
  fileSha256: string;
  ocrModel: string;
  documentType: string;
  schemaCode: string;
  schemaVersion: number;
  /**
   * Huella de todo lo que determina el resultado (versión del pipeline, esquema y prompt de
   * anotación, clasificador de imágenes, parámetros). Forma parte de la clave de deduplicación.
   */
  pipelineFingerprint: string;
  /** Hay al menos una señal de inyección en alguna página. */
  injectionSuspected: boolean;
  pages: Array<{
    index: number;
    text: string;
    header?: string;
    footer?: string;
    confidence?: number;
    /** La página empieza con la misma tabla con la que terminó la anterior (para el chunker). */
    tableContinuesFromPrevious?: boolean;
    injectionSignals?: InjectionSignal[];
  }>;
  candidates: ExtractedFieldCandidate[];
  /**
   * Imágenes clasificadas. `description` la genera el modelo de OCR: es texto del proveedor, no
   * del documento, por eso vive aparte de `pages[].text` y nunca sirve como cita de evidencia.
   */
  images: Array<{ page: number; id: string; kind: ImageKind; relevant: boolean; description: string }>;
  createdAt: string;
  isLab: boolean;
};
