import { describe, expect, it } from "vitest";
import type { OcrDocument } from "../contracts/ocr";
import { resolveDocumentSchema } from "./document-schemas";
import { buildExtraction, normalizePageText } from "./ocr-normalizer";
import { normalizeCui, normalizeDate, normalizeInteger, normalizeMoney } from "./value-normalizers";

describe("normalizadores de valores", () => {
  it("montos es-GT y formatos europeos marcados", () => {
    expect(normalizeMoney("Q12,500.00")).toEqual({ value: "Q12,500.00" });
    expect(normalizeMoney("Q. 3200")).toEqual({ value: "Q3,200.00" });
    expect(normalizeMoney("GTQ 1,248.1")).toEqual({ value: "Q1,248.10" });
    expect(normalizeMoney("12.500,00")).toMatchObject({ value: "Q12,500.00", attention: expect.stringContaining("inusual") });
    expect(normalizeMoney("doce mil")).toMatchObject({ attention: expect.stringContaining("no reconocido") });
  });

  it("fechas a dd/mm/aaaa, incluidas las de mes en español", () => {
    expect(normalizeDate("5/3/2030")).toEqual({ value: "05/03/2030" });
    expect(normalizeDate("2030-03-05")).toEqual({ value: "05/03/2030" });
    expect(normalizeDate("12 MAR 2030")).toEqual({ value: "12/03/2030" });
    expect(normalizeDate("1 de diciembre de 1985")).toEqual({ value: "01/12/1985" });
    expect(normalizeDate("31/02/2030").attention).toBeTruthy();
  });

  it("CUI de 13 dígitos con departamento válido", () => {
    expect(normalizeCui("1234 56789 0101")).toEqual({ value: "1234 56789 0101" });
    expect(normalizeCui("1234567890901").attention).toBeUndefined();
    expect(normalizeCui("12345678923 01").attention).toContain("departamento");
    expect(normalizeCui("12345").attention).toContain("13 dígitos");
  });

  it("enteros", () => {
    expect(normalizeInteger("3 créditos")).toEqual({ value: "3" });
    expect(normalizeInteger("ninguno").attention).toBeTruthy();
  });
});

describe("normalizePageText", () => {
  it("une palabras partidas, quita números de página y colapsa espacios", () => {
    const text = normalizePageText("La capa-\ncidad de pago   es suficiente.\n\n\n\nPágina 2 de 5\n3\nFin");
    expect(text).toBe("La capacidad de pago es suficiente.\n\nFin");
  });

  it("reemplaza imágenes relevantes por descripción y elimina logos", () => {
    const text = normalizePageText("Encabezado\n![img-0.jpeg](img-0.jpeg)\n![img-1.jpeg](img-1.jpeg)\nTexto", [
      { id: "img-0.jpeg", classification: { kind: "LOGO", relevant: false, description: "Logo del banco" } },
      { id: "img-1.jpeg", classification: { kind: "SKETCH", relevant: true, description: "Croquis: 2 cuadras al norte del parque" } },
    ]);
    expect(text).toContain("[Imagen: Croquis: 2 cuadras al norte del parque]");
    expect(text).not.toContain("Logo");
  });

  it("no toca el espaciado interno de las tablas", () => {
    expect(normalizePageText("| Acreedor | Cuota |\n|---|---|\n| Banco A  | Q1,500.00 |")).toContain("| Banco A  | Q1,500.00 |");
  });
});

const bureauOcr: OcrDocument = {
  model: "mistral-ocr-2607",
  usage: { pagesProcessed: 2 },
  annotation: {
    active_debts_count: "2",
    total_monthly_payment: "Q3,200.00",
    total_balance: "45.000,00",
    max_delinquency_months: "0",
    inquiries_count: "7",
  },
  pages: [
    {
      index: 1,
      markdown: "REPORTE DE CRÉDITO\nCréditos vigentes: 2\nConsultas en los últimos 6 meses: 7",
      header: "Buró Sintético S.A.",
      footer: "Documento sintético de prueba",
      blocks: [
        { text: "Créditos vigentes: 2", confidence: 0.98 },
        { text: "Consultas en los últimos 6 meses: 7", confidence: 0.55 },
      ],
      images: [],
      confidence: 0.9,
    },
    {
      index: 2,
      markdown: "| Acreedor | Cuota |\n|---|---|\n| Banco A | Q1,700.00 |\n| Coop B | Q1,500.00 |\nCuota mensual total: Q3,200.00\nSaldo total: 45.000,00\n![img-0.jpeg](img-0.jpeg)",
      blocks: [{ text: "Cuota mensual total: Q3,200.00", confidence: 0.97 }],
      images: [{ id: "img-0.jpeg", classification: { kind: "SIGNATURE", relevant: true, description: "Firma de Juan" } }],
      confidence: 0.93,
    },
  ],
};

function build(ocr: OcrDocument = bureauOcr) {
  const resolved = resolveDocumentSchema("BUREAU_REPORT");
  return buildExtraction({
    id: "ext-1",
    fileSha256: "sha",
    documentType: "BUREAU_REPORT",
    schemaCode: resolved.code,
    schemaVersion: resolved.version,
    schema: resolved.schema,
    ocr,
    confidenceThreshold: 0.8,
    createdAt: "2026-09-28T10:00:00.000Z",
    isLab: true,
  });
}

describe("buildExtraction", () => {
  it("genera candidatos con página y confianza, nunca confirmados", () => {
    const extraction = build();
    const payment = extraction.candidates.find((c) => c.fieldKey === "total_monthly_payment")!;
    expect(payment).toMatchObject({ value: "Q3,200.00", page: 2, confidence: 0.97, needsAttention: false });
    for (const candidate of extraction.candidates) {
      expect(candidate).not.toHaveProperty("status");
    }
  });

  it("alta confianza no confirma; baja confianza se marca para revisión", () => {
    const inquiries = build().candidates.find((c) => c.fieldKey === "inquiries_count")!;
    expect(inquiries).toMatchObject({ page: 1, confidence: 0.55, needsAttention: true });
    expect(inquiries.attentionReason).toContain("baja confianza");
  });

  it("marca formatos dudosos y valores que no aparecen en el texto (posible alucinación)", () => {
    const balance = build().candidates.find((c) => c.fieldKey === "total_balance")!;
    expect(balance.attentionReason).toContain("inusual");
    const invented = build({ ...bureauOcr, annotation: { ...bureauOcr.annotation, max_delinquency_months: "9" } });
    const delinquency = invented.candidates.find((c) => c.fieldKey === "max_delinquency_months")!;
    expect(delinquency.page).toBeUndefined();
    expect(delinquency.attentionReason).toContain("No aparece en el texto");
  });

  it("omite campos nulos o vacíos", () => {
    const extraction = build({ ...bureauOcr, annotation: { total_monthly_payment: null, total_balance: "", inquiries_count: "null" } });
    expect(extraction.candidates).toEqual([]);
  });

  it("encabezados y pies quedan fuera del texto; firmas solo como presencia", () => {
    const extraction = build();
    expect(extraction.pages[0]!.text).not.toContain("Buró Sintético S.A.");
    expect(extraction.pages[0]!.header).toBe("Buró Sintético S.A.");
    expect(extraction.images).toEqual([{ page: 2, id: "img-0.jpeg", kind: "SIGNATURE", relevant: false, description: "Firma presente" }]);
    expect(extraction.pages[1]!.text).not.toContain("Juan");
  });

  it("guarda el modelo real que reportó el proveedor", () => {
    expect(build().ocrModel).toBe("mistral-ocr-2607");
  });

  it("detecta tablas que continúan en la página siguiente", () => {
    const table = "| Acreedor | Cuota |\n|---|---|\n| Banco A | Q1,700.00 |";
    const extraction = build({
      ...bureauOcr,
      pages: [
        { index: 1, markdown: `Detalle\n${table}`, blocks: [], images: [] },
        { index: 2, markdown: "| Acreedor | Cuota |\n|---|---|\n| Coop B | Q1,500.00 |", blocks: [], images: [] },
      ],
    });
    expect(extraction.pages[1]!.tableContinuesFromPrevious).toBe(true);
    expect(extraction.pages[0]!.tableContinuesFromPrevious).toBeUndefined();
  });
});
