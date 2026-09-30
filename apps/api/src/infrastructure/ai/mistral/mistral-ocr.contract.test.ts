import { describe, it } from "vitest";
import { FakeOcrProvider, ocrProviderContract } from "@crece/ai-engine/testing";
import { AI_ENGINE_CONFIG_SEED, type OcrDocument, type OcrRequest } from "@crece/ai-engine";
import { MistralOcrProvider } from "./mistral-ocr-provider";

/** Fake que cumple el contrato: sirve de referencia de lo que el adaptador real debe devolver. */
function contractFake(): FakeOcrProvider {
  return new FakeOcrProvider("fake-ocr", (request: OcrRequest): OcrDocument => {
    const pages = [
      { index: 1, markdown: "REPORTE DE CREDITO SINTETICO\nCreditos vigentes: 2\nCuota mensual total: Q3,200.00", blocks: [], images: [], confidence: 0.99 },
      { index: 2, markdown: "Pagina de anexos\nConsultas recientes: 7", blocks: [], images: [], confidence: 0.99 },
    ];
    return {
      model: "fake-ocr",
      pages,
      ...(request.annotationSchema ? { annotation: { total_monthly_payment: "Q3,200.00" } } : {}),
      usage: { pagesProcessed: pages.length },
    };
  });
}

describe("contrato OcrProvider — fake de referencia", () => {
  for (const contract of ocrProviderContract) {
    it(contract.name, () => contract.run(contractFake()));
  }
});

const apiKey = process.env.MISTRAL_API_KEY;
const model = process.env.AI_OCR_MODEL ?? AI_ENGINE_CONFIG_SEED.models.ocr;

describe.runIf(Boolean(apiKey))(`contrato OcrProvider — Mistral real (${model})`, () => {
  for (const contract of ocrProviderContract) {
    it(contract.name, () => contract.run(new MistralOcrProvider(apiKey!, model)), 120_000);
  }
});
