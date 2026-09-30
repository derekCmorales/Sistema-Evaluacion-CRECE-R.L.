import type { OcrDocument } from "../contracts/ocr";
import type { TokenUsage } from "../contracts/common";

/** Esquema JSON que guía la extracción estructurada de un tipo de documento. */
export type AnnotationSchema = {
  name: string;
  jsonSchema: Record<string, unknown>;
  prompt?: string;
};

export type OcrRequest = {
  bytes: Uint8Array;
  mimeType: string;
  fileName: string;
  annotationSchema?: AnnotationSchema;
  /** Si viene, el proveedor clasifica cada imagen extraída con este esquema. */
  imageClassificationSchema?: AnnotationSchema;
  /** Ignora imágenes menores a este lado en píxeles. */
  imageMinSize?: number;
};

export type OcrProvider = {
  /** Modelo fijado; forma parte de la clave de deduplicación. */
  readonly modelId: string;
  extract(request: OcrRequest): Promise<OcrDocument>;
};

export type EmbeddingInput = {
  /** Encabezado de contexto (ruta de la sección); el adaptador decide cómo formatearlo. */
  title: string;
  text: string;
};

export type EmbeddingProvider = {
  readonly modelId: string;
  embedDocuments(
    items: EmbeddingInput[],
    dimensions: number,
  ): Promise<{ vectors: number[][]; inputTokens: number }>;
  embedQuery(text: string, dimensions: number): Promise<{ vector: number[]; inputTokens: number }>;
};

export type ThinkingLevel = "LOW" | "MEDIUM" | "HIGH";

export type LlmRequest = {
  modelId: string;
  /** Instrucciones del sistema (estables: van primero para el caché implícito). */
  systemInstruction: string;
  /** Turno de usuario ya armado con los datos delimitados. */
  contents: string;
  responseJsonSchema: Record<string, unknown>;
  maxOutputTokens: number;
  thinkingLevel: ThinkingLevel;
  temperature?: number;
};

export type LlmFinishReason = "STOP" | "MAX_TOKENS" | "SAFETY" | "OTHER";

export type LlmResponse = {
  /** Texto crudo; el motor lo parsea y valida (nunca el adaptador). */
  rawText: string;
  finishReason: LlmFinishReason;
  usage: TokenUsage;
  modelVersion?: string;
};

/** Sin herramientas, sin function calling, sin acceso web: solo salida estructurada. */
export type LlmProvider = {
  generateStructured(request: LlmRequest): Promise<LlmResponse>;
};
