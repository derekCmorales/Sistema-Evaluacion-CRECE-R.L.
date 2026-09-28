import { describe, it } from "vitest";
import { FakeOcrProvider, ocrProviderContract } from "@crece/ai-engine/testing";
import type { OcrDocument, OcrRequest } from "@crece/ai-engine";
import { MistralOcrProvider } from "./mistral-ocr-provider";

/** Fake que cumple el contrato: sirve de referencia de lo que el adaptador real debe devolver. */
function contractFake(): FakeOcrProvider {
  return new FakeOcrProvider("fake-ocr", (request: OcrRequest): OcrDocument => {
    const pages = [
      { index: 1, markdown: "REPORTE DE CREDITO SINTETICO\nCreditos vigentes: 2\nCuota mensual total: Q3,200.00", blocks: [], images: [], confidence: 0.99 },
      { index: 2, markdown: "Pagina de anexos\nConsultas recientes: 7", blocks: [], images: [], confidence: 0.99 },
    ];
    const selected = request.pages ? pages.filter((p) => request.pages!.includes(p.index - 1)) : pages;
    return {
      model: "fake-ocr",
      pages: selected,
      ...(request.annotationSchema ? { annotation: { total_monthly_payment: "Q3,200.00" } } : {}),
      usage: { pagesProcessed: selected.length },
    };
  });
}

describe("contrato OcrProvider — fake de referencia", () => {
  for (const contract of ocrProviderContract) {
    it(contract.name, () => contract.run(contractFake()));
  }
});

const apiKey = process.env.MISTRAL_API_KEY;
const model = process.env.AI_OCR_MODEL ?? "mistral-ocr-latest";

describe.runIf(Boolean(apiKey))(`contrato OcrProvider — Mistral real (${model})`, () => {
  for (const contract of ocrProviderContract) {
    it(contract.name, () => contract.run(new MistralOcrProvider(apiKey!, model)), 120_000);
  }
});
