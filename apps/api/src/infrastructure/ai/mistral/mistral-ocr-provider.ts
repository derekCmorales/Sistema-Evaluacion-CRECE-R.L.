import { Mistral } from "@mistralai/mistralai";
import type { OCRRequest, OCRResponse } from "@mistralai/mistralai/models/components";
import { z } from "zod";
import {
  AiEngineError,
  IMAGE_KINDS,
  type AnnotationSchema,
  type BoundingBox,
  type OcrDocument,
  type OcrProvider,
  type OcrRequest,
} from "@crece/ai-engine";

const ImageAnnotationSchema = z.object({
  kind: z.enum(IMAGE_KINDS),
  relevant: z.boolean(),
  description: z.string(),
});

function responseFormat(schema: AnnotationSchema): NonNullable<OCRRequest["documentAnnotationFormat"]> {
  return {
    type: "json_schema",
    jsonSchema: { name: schema.name, schemaDefinition: schema.jsonSchema, strict: true },
  };
}

const toBase64 = (bytes: Uint8Array) => Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString("base64");

/** Traduce la solicitud del motor al formato de Mistral OCR (datos en línea, sin URLs públicas). */
export function toMistralRequest(request: OcrRequest, model: string): OCRRequest {
  const dataUrl = `data:${request.mimeType};base64,${toBase64(request.bytes)}`;
  return {
    model,
    document: request.mimeType.startsWith("image/")
      ? { type: "image_url", imageUrl: dataUrl }
      : { type: "document_url", documentUrl: dataUrl, documentName: request.fileName },
    includeImageBase64: false,
    extractHeader: true,
    extractFooter: true,
    includeBlocks: true,
    confidenceScoresGranularity: "block",
    tableFormat: "markdown",
    ...(request.imageMinSize ? { imageMinSize: request.imageMinSize } : {}),
    ...(request.annotationSchema
      ? {
          documentAnnotationFormat: responseFormat(request.annotationSchema),
          ...(request.annotationSchema.prompt ? { documentAnnotationPrompt: request.annotationSchema.prompt } : {}),
        }
      : {}),
    ...(request.imageClassificationSchema
      ? { bboxAnnotationFormat: responseFormat(request.imageClassificationSchema) }
      : {}),
  };
}

function bbox(
  box: { topLeftX: number | null; topLeftY: number | null; bottomRightX: number | null; bottomRightY: number | null },
  dims: { width: number; height: number } | null,
): BoundingBox | undefined {
  if (!dims || box.topLeftX == null || box.topLeftY == null || box.bottomRightX == null || box.bottomRightY == null) {
    return undefined;
  }
  return {
    x: box.topLeftX / dims.width,
    y: box.topLeftY / dims.height,
    width: (box.bottomRightX - box.topLeftX) / dims.width,
    height: (box.bottomRightY - box.topLeftY) / dims.height,
  };
}

function parseJson(value: string | null | undefined): unknown {
  if (!value) return undefined;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

/** Respuesta de Mistral → `OcrDocument` del motor (capa anticorrupción). Páginas 1-based. */
export function fromMistralResponse(response: OCRResponse): OcrDocument {
  const annotation = parseJson(response.documentAnnotation);
  return {
    model: response.model,
    pages: response.pages.map((page) => {
      const blocks = (page.blocks ?? []).flatMap((block) => {
        if (!("content" in block) || typeof block.content !== "string") return [];
        const scores = "confidenceScores" in block ? block.confidenceScores : undefined;
        const confidence = scores?.averageContentConfidenceScore ?? undefined;
        const box = "topLeftX" in block ? bbox(block as Parameters<typeof bbox>[0], page.dimensions) : undefined;
        return [{ text: block.content, ...(box ? { bbox: box } : {}), ...(confidence != null ? { confidence } : {}) }];
      });
      const blockScores = blocks.map((b) => b.confidence).filter((c): c is number => c != null);
      const pageConfidence =
        page.confidenceScores?.averagePageConfidenceScore ??
        (blockScores.length ? blockScores.reduce((a, b) => a + b, 0) / blockScores.length : undefined);
      return {
        index: page.index + 1,
        markdown: page.markdown,
        ...(page.header ? { header: page.header } : {}),
        ...(page.footer ? { footer: page.footer } : {}),
        blocks,
        images: page.images.map((image) => {
          const classification = ImageAnnotationSchema.safeParse(parseJson(image.imageAnnotation));
          const box = bbox(image, page.dimensions);
          return {
            id: image.id,
            ...(box ? { bbox: box } : {}),
            ...(classification.success ? { classification: classification.data } : {}),
          };
        }),
        ...(pageConfidence != null ? { confidence: pageConfidence } : {}),
      };
    }),
    ...(annotation && typeof annotation === "object" ? { annotation: annotation as Record<string, unknown> } : {}),
    usage: {
      pagesProcessed: response.usageInfo.pagesProcessed,
      ...(response.usageInfo.docSizeBytes != null ? { docSizeBytes: response.usageInfo.docSizeBytes } : {}),
    },
  };
}

/** Errores del SDK → códigos estables del motor. Nunca copia cuerpos ni cabeceras. */
export function mapMistralError(error: unknown): AiEngineError {
  const e = error as { name?: string; statusCode?: number };
  if (e?.name === "RequestTimeoutError" || e?.name === "RequestAbortedError") {
    return new AiEngineError("AI_PROVIDER_TIMEOUT", "El servicio de OCR no respondió a tiempo");
  }
  if (e?.name === "ConnectionError") {
    return new AiEngineError("AI_PROVIDER_ERROR", "No se pudo conectar con el servicio de OCR");
  }
  const status = typeof e?.statusCode === "number" ? e.statusCode : undefined;
  if (status === 401 || status === 403) {
    return new AiEngineError("AI_PROVIDER_AUTH", "El servicio de OCR rechazó las credenciales");
  }
  if (status === 404) {
    // Modelo inexistente o sin acceso: es configuración, no se arregla reintentando.
    return new AiEngineError("AI_PROVIDER_AUTH", "El modelo de OCR configurado no existe o la cuenta no tiene acceso");
  }
  if (status === 429) return new AiEngineError("AI_PROVIDER_RATE_LIMITED", "Límite de uso del servicio de OCR");
  if (status === 408 || status === 504) {
    return new AiEngineError("AI_PROVIDER_TIMEOUT", "El servicio de OCR no respondió a tiempo");
  }
  if (status === 413) return new AiEngineError("AI_INPUT_TOO_LARGE", "El documento supera el tamaño que acepta el servicio de OCR");
  if (status === 415) return new AiEngineError("AI_INPUT_UNSUPPORTED_TYPE", "El servicio de OCR no admite este tipo de archivo");
  if (status === 400 || status === 422) {
    return new AiEngineError("AI_INPUT_CORRUPT", "El servicio de OCR rechazó el documento (ilegible o mal formado)");
  }
  return new AiEngineError("AI_PROVIDER_ERROR", "El servicio de OCR devolvió un error");
}

/**
 * Alias de Mistral que cambian de modelo sin aviso («mistral-ocr-latest», «mistral-ocr-4»). La
 * deduplicación y la reproducibilidad exigen una versión fijada («mistral-ocr-4-1»).
 */
export function isMovingMistralAlias(modelId: string): boolean {
  return /-latest$/i.test(modelId) || /^mistral-ocr-\d+$/i.test(modelId);
}

export class MistralOcrProvider implements OcrProvider {
  private readonly client: Mistral;

  constructor(
    apiKey: string,
    readonly modelId: string,
    timeoutMs = 120_000,
  ) {
    if (isMovingMistralAlias(modelId)) {
      throw new Error(`El modelo de OCR debe ser una versión fijada, no el alias «${modelId}» (p. ej. mistral-ocr-4-1)`);
    }
    // Sin reintentos del SDK: el motor decide cuándo y cuánto reintentar.
    this.client = new Mistral({ apiKey, timeoutMs, retryConfig: { strategy: "none" } });
  }

  async extract(request: OcrRequest): Promise<OcrDocument> {
    try {
      const response = await this.client.ocr.process(toMistralRequest(request, this.modelId));
      return fromMistralResponse(response);
    } catch (error) {
      throw mapMistralError(error);
    }
  }
}
