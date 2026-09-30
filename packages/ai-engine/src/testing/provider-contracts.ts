import type { OcrProvider } from "../ports";
import { toAnnotationSchema, resolveDocumentSchema } from "../extraction/document-schemas";
import { syntheticPdf } from "./synthetic-files";

/**
 * Contratos de puertos como casos planos (sin dependencia de un runner): la misma batería corre
 * contra el fake y contra el adaptador real. Cada caso lanza Error si el contrato no se cumple.
 */
export type ContractCase<P> = { name: string; run(provider: P): Promise<void> };

function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Contrato incumplido: ${message}`);
}

/** Documento sintético del contrato OCR (sin PII). */
export const OCR_CONTRACT_PDF = syntheticPdf([
  ["REPORTE DE CREDITO SINTETICO", "Creditos vigentes: 2", "Cuota mensual total: Q3,200.00"],
  ["Pagina de anexos", "Consultas recientes: 7"],
]);

const baseRequest = { bytes: OCR_CONTRACT_PDF, mimeType: "application/pdf", fileName: "contrato-buro.pdf" };

export const ocrProviderContract: ContractCase<OcrProvider>[] = [
  {
    name: "devuelve páginas 1-based con el texto del documento y el modelo usado",
    async run(provider) {
      const doc = await provider.extract(baseRequest);
      check(doc.model.length > 0, "model vacío");
      check(doc.pages.length === 2, `se esperaban 2 páginas, llegaron ${doc.pages.length}`);
      check(doc.pages[0]!.index === 1 && doc.pages[1]!.index === 2, "índices de página no son 1-based");
      check(/cuota mensual total/i.test(doc.pages[0]!.markdown), "no aparece el texto de la página 1");
      check(doc.usage.pagesProcessed >= 2, "usage.pagesProcessed incompleto");
      for (const page of doc.pages) {
        if (page.confidence != null) check(page.confidence >= 0 && page.confidence <= 1, "confianza fuera de 0..1");
        for (const block of page.blocks) {
          if (block.confidence != null) check(block.confidence >= 0 && block.confidence <= 1, "confianza de bloque fuera de 0..1");
        }
      }
    },
  },
  {
    name: "con esquema de buró devuelve la anotación con la cuota mensual",
    async run(provider) {
      const schema = toAnnotationSchema(resolveDocumentSchema("BUREAU_REPORT").schema!)!;
      const doc = await provider.extract({ ...baseRequest, annotationSchema: schema });
      const payment = doc.annotation?.["total_monthly_payment"];
      check(typeof payment === "string" && payment.includes("3,200"), `cuota mensual inesperada: ${String(payment)}`);
    },
  },
];
