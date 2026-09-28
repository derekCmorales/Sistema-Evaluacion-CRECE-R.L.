import { describe, expect, it } from "vitest";
import type { OCRResponse } from "@mistralai/mistralai/models/components";
import { fromMistralResponse, mapMistralError, toMistralRequest } from "./mistral-ocr-provider";

const schema = { name: "crece_dpi_v1", jsonSchema: { type: "object" }, prompt: "No infieras." };

describe("toMistralRequest", () => {
  it("PDF en línea, sin imágenes base64, con encabezados/pies separados y confianza por bloque", () => {
    const request = toMistralRequest(
      { bytes: new Uint8Array([37, 80, 68, 70]), mimeType: "application/pdf", fileName: "dpi.pdf", annotationSchema: schema, pages: [0, 1] },
      "mistral-ocr-2607",
    );
    expect(request.document).toEqual({ type: "document_url", documentUrl: "data:application/pdf;base64,JVBERg==", documentName: "dpi.pdf" });
    expect(request).toMatchObject({
      model: "mistral-ocr-2607",
      includeImageBase64: false,
      extractHeader: true,
      extractFooter: true,
      confidenceScoresGranularity: "block",
      pages: [0, 1],
      documentAnnotationPrompt: "No infieras.",
      documentAnnotationFormat: { type: "json_schema", jsonSchema: { name: "crece_dpi_v1", strict: true } },
    });
    expect(request.bboxAnnotationFormat).toBeUndefined();
  });

  it("imágenes van como image_url y la clasificación de imágenes como bbox annotation", () => {
    const request = toMistralRequest(
      { bytes: new Uint8Array([0xff, 0xd8]), mimeType: "image/jpeg", fileName: "foto.jpg", imageClassificationSchema: schema },
      "m",
    );
    expect(request.document).toEqual({ type: "image_url", imageUrl: "data:image/jpeg;base64,/9g=" });
    expect(request.bboxAnnotationFormat?.jsonSchema?.name).toBe("crece_dpi_v1");
  });
});

describe("fromMistralResponse", () => {
  const response = {
    model: "mistral-ocr-2607",
    documentAnnotation: JSON.stringify({ cui: "1234 56789 0101" }),
    usageInfo: { pagesProcessed: 1, docSizeBytes: 1000 },
    pages: [
      {
        index: 0,
        markdown: "DPI\n![img-0.jpeg](img-0.jpeg)",
        header: "RENAP",
        footer: null,
        dimensions: { dpi: 200, width: 1000, height: 500 },
        images: [
          {
            id: "img-0.jpeg",
            topLeftX: 100,
            topLeftY: 50,
            bottomRightX: 300,
            bottomRightY: 250,
            imageAnnotation: JSON.stringify({ kind: "ID_PHOTO", relevant: false, description: "Foto" }),
          },
          { id: "img-1.jpeg", topLeftX: null, topLeftY: null, bottomRightX: null, bottomRightY: null, imageAnnotation: "no-json" },
        ],
        blocks: [
          { type: "text", content: "CUI 1234 56789 0101", topLeftX: 0, topLeftY: 0, bottomRightX: 500, bottomRightY: 50, confidenceScores: { averageContentConfidenceScore: 0.9 } },
          { type: "title", content: "DPI", topLeftX: 0, topLeftY: 0, bottomRightX: 100, bottomRightY: 20, confidenceScores: { averageContentConfidenceScore: 0.7 } },
        ],
      },
    ],
  } as unknown as OCRResponse;

  it("páginas 1-based, bloques con confianza y caja normalizada, anotación parseada", () => {
    const doc = fromMistralResponse(response);
    expect(doc.model).toBe("mistral-ocr-2607");
    expect(doc.annotation).toEqual({ cui: "1234 56789 0101" });
    const page = doc.pages[0]!;
    expect(page.index).toBe(1);
    expect(page.header).toBe("RENAP");
    expect(page.footer).toBeUndefined();
    expect(page.blocks[0]).toEqual({ text: "CUI 1234 56789 0101", confidence: 0.9, bbox: { x: 0, y: 0, width: 0.5, height: 0.1 } });
    expect(page.confidence).toBeCloseTo(0.8);
  });

  it("clasificación de imagen válida se conserva; inválida se ignora", () => {
    const images = fromMistralResponse(response).pages[0]!.images;
    expect(images[0]).toMatchObject({ id: "img-0.jpeg", classification: { kind: "ID_PHOTO" }, bbox: { x: 0.1, y: 0.1 } });
    expect(images[1]).toEqual({ id: "img-1.jpeg" });
  });
});

describe("mapMistralError", () => {
  it.each([
    [{ statusCode: 401 }, "AI_PROVIDER_AUTH", false],
    [{ statusCode: 429 }, "AI_PROVIDER_RATE_LIMITED", true],
    [{ statusCode: 504 }, "AI_PROVIDER_TIMEOUT", true],
    [{ name: "RequestTimeoutError" }, "AI_PROVIDER_TIMEOUT", true],
    [{ statusCode: 422 }, "AI_INPUT_CORRUPT", false],
    [{ statusCode: 500 }, "AI_PROVIDER_ERROR", true],
    [new Error("boom"), "AI_PROVIDER_ERROR", true],
  ])("%o → %s", (input, code, retryable) => {
    const error = mapMistralError(input);
    expect(error.code).toBe(code);
    expect(error.retryable).toBe(retryable);
  });

  it("el mensaje nunca incluye el cuerpo de la respuesta", () => {
    const error = mapMistralError({ statusCode: 401, body: '{"detail":"key sk-abc123 invalid"}' });
    expect(error.message).not.toContain("sk-abc123");
  });
});
